import {
	db,
	githubRepositoryEmbeddings,
	githubRepositoryIndex,
} from "@/drizzle";
import {
	GitHubBlobLoader,
	type GitHubBlobMetadata,
	type GithubRepositoryParams,
	octokit,
} from "@giselle-sdk/github-tool";
import {
	type BaseEmbedding,
	type EmbeddingStore,
	ingest,
} from "@giselle-sdk/rag";
import { captureException } from "@sentry/nextjs";
import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

export const maxDuration = 800;

/**
 * GitHub repository embedding data structure
 */
interface GitHubRepositoryEmbedding {
	owner: string;
	repo: string;
	commitSha: string;
	fileSha: string;
	path: string;
	nodeId: string;
	chunkIndex: number;
	chunkContent: string;
	embedding: number[];
}

// ingest GitHub Code
export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response("Unauthorized", {
			status: 401,
		});
	}

	const targetGitHubRepositories = await fetchTargetGitHubRepositories();

	for (const targetGitHubRepository of targetGitHubRepositories) {
		const { owner, repo, installationId, lastIngestedCommitSha, teamDbId } =
			targetGitHubRepository;

		const appId = process.env.GITHUB_APP_ID;
		if (!appId) {
			throw new Error("GITHUB_APP_ID is empty");
		}
		const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
		if (!privateKey) {
			throw new Error("GITHUB_APP_PRIVATE_KEY is empty");
		}

		const octokitClient = octokit({
			strategy: "app-installation",
			appId,
			privateKey,
			installationId,
		});

		// Create GitHub repository loader
		const loader = new GitHubBlobLoader(octokitClient, {
			maxBlobSize: 1 * 1024 * 1024, // 1MB limit
		});

		const source: GithubRepositoryParams = {
			owner,
			repo,
		};

		const embeddingStore = new GitHubRepositoryEmbeddingStoreImpl(teamDbId);

		// Ingest using the RAG package
		await ingest({
			source,
			loader,
			store: embeddingStore,
			transformEmbedding: transformGitHubEmbedding,
		});
	}

	return new Response("ok", { status: 200 });
}

/**
 * Transform base embedding to GitHub repository embedding
 */
function transformGitHubEmbedding(
	baseEmbedding: BaseEmbedding,
	metadata: GitHubBlobMetadata,
): GitHubRepositoryEmbedding {
	return {
		owner: metadata.owner,
		repo: metadata.repo,
		commitSha: metadata.commitSha,
		fileSha: metadata.fileSha,
		path: metadata.path,
		nodeId: metadata.nodeId,
		chunkIndex: baseEmbedding.chunkIndex,
		chunkContent: baseEmbedding.chunkContent,
		embedding: baseEmbedding.embedding,
	};
}

type TargetGitHubRepository = {
	owner: string;
	repo: string;
	teamDbId: number;
	installationId: number;
	lastIngestedCommitSha: string | null;
};

async function fetchTargetGitHubRepositories(): Promise<
	TargetGitHubRepository[]
> {
	const records = await db
		.select({
			owner: githubRepositoryIndex.owner,
			repo: githubRepositoryIndex.repo,
			installationId: githubRepositoryIndex.installationId,
			lastIngestedCommitSha: githubRepositoryIndex.lastIngestedCommitSha,
			teamDbId: githubRepositoryIndex.teamDbId,
		})
		.from(githubRepositoryIndex)
		.where(eq(githubRepositoryIndex.status, "idle"));

	return records.map((record) => ({
		owner: record.owner,
		repo: record.repo,
		installationId: record.installationId,
		lastIngestedCommitSha: record.lastIngestedCommitSha,
		teamDbId: record.teamDbId,
	}));
}

/**
 * Implementation of EmbeddingStore for GitHub repositories
 */
class GitHubRepositoryEmbeddingStoreImpl
	implements EmbeddingStore<GitHubRepositoryEmbedding>
{
	private teamDbId: number;
	constructor(teamDbId: number) {
		this.teamDbId = teamDbId;
	}

	private async getRepositoryIndexDbId(owner: string, repo: string) {
		return this.withPgRetry(async () => {
			const records = await db
				.select({ dbId: githubRepositoryIndex.dbId })
				.from(githubRepositoryIndex)
				.where(
					and(
						eq(githubRepositoryIndex.owner, owner),
						eq(githubRepositoryIndex.repo, repo),
						eq(githubRepositoryIndex.teamDbId, this.teamDbId),
					),
				)
				.limit(1);
			const repositoryIndex = records[0];
			if (repositoryIndex == null) {
				throw new Error(`Repository index not found: ${owner}/${repo}`);
			}
			return repositoryIndex.dbId;
		});
	}

	async insertEmbedding(data: GitHubRepositoryEmbedding): Promise<void> {
		const repositoryIndexDbId = await this.getRepositoryIndexDbId(
			data.owner,
			data.repo,
		);
		await this.withPgRetry(async () => {
			await db
				.insert(githubRepositoryEmbeddings)
				.values({
					repositoryIndexDbId,
					commitSha: data.commitSha,
					fileSha: data.fileSha,
					path: data.path,
					nodeId: data.nodeId,
					embedding: data.embedding,
					chunkIndex: data.chunkIndex,
					chunkContent: data.chunkContent,
				})
				.onConflictDoNothing();
		});
	}

	async deleteEmbedding(
		key: Partial<GitHubRepositoryEmbedding>,
	): Promise<void> {
		if (key.owner != null && key.repo != null && key.path != null) {
			const { owner, repo, path } = key;

			const repositoryIndexDbId = await this.getRepositoryIndexDbId(
				owner,
				repo,
			);
			await this.withPgRetry(async () => {
				await db
					.delete(githubRepositoryEmbeddings)
					.where(
						and(
							eq(
								githubRepositoryEmbeddings.repositoryIndexDbId,
								repositoryIndexDbId,
							),
							eq(githubRepositoryEmbeddings.path, path),
						),
					);
			});
		}
	}

	async updateEmbedding(data: GitHubRepositoryEmbedding): Promise<void> {
		// retry is done in deleteEmbedding and insertEmbedding
		await this.deleteEmbedding(data);
		await this.insertEmbedding(data);
	}

	async startIngestion(params: Record<string, unknown>): Promise<void> {
		const source = params.source as GithubRepositoryParams;
		if (!source) {
			console.warn("startIngestion: source is missing", params);
			return;
		}

		await this.withPgRetry(async () => {
			await db
				.update(githubRepositoryIndex)
				.set({ status: "running" })
				.where(
					and(
						eq(githubRepositoryIndex.owner, source.owner),
						eq(githubRepositoryIndex.repo, source.repo),
					),
				);
		});
	}

	async completeIngestion(params: Record<string, unknown>): Promise<void> {
		const source = params.source as GithubRepositoryParams;
		if (!source) {
			console.warn("completeIngestion: source is missing", params);
			return;
		}

		const commitSha = params.commitSha as string;
		await this.withPgRetry(async () => {
			await db
				.update(githubRepositoryIndex)
				.set({
					status: "completed",
					lastIngestedCommitSha: commitSha,
				})
				.where(
					and(
						eq(githubRepositoryIndex.owner, source.owner),
						eq(githubRepositoryIndex.repo, source.repo),
					),
				);
		});
	}

	async failIngestion(
		params: Record<string, unknown>,
		error: Error,
	): Promise<void> {
		const source = params.source as GithubRepositoryParams;
		if (!source) {
			console.warn("failIngestion: source is missing", params);
			captureException(error);
			return;
		}

		captureException(error, {
			extra: {
				owner: source.owner,
				repo: source.repo,
			},
		});
		await this.withPgRetry(async () => {
			await db
				.update(githubRepositoryIndex)
				.set({ status: "failed" })
				.where(
					and(
						eq(githubRepositoryIndex.owner, source.owner),
						eq(githubRepositoryIndex.repo, source.repo),
					),
				);
		});
	}

	// ingesting job may be a long running job, so it would be better to care transient errors
	// https://www.postgresql.org/docs/16/errcodes-appendix.html
	private TRANSIENT_CODES = new Set([
		// Class 08 - Connection Exception
		"08000",
		"08003",
		"08006",
		"08001",
		"08004",
		"08007",
		// Class 53 - Resource Exception
		"53300", // too_many_connections
		// Class 40 - Transaction Rollback
		"40001", // serialization_failure
		"40P01", // deadlock_detected
	]);

	private isTransientError(error: unknown) {
		if (
			typeof error === "object" &&
			error !== null &&
			"code" in error &&
			typeof error.code === "string"
		) {
			return this.TRANSIENT_CODES.has(error.code);
		}
		return false;
	}

	private async withPgRetry<T>(
		fn: () => Promise<T>,
		attempt = 0,
		maxAttempts = 4,
	): Promise<T> {
		try {
			return await fn();
		} catch (error: unknown) {
			if (!this.isTransientError(error)) {
				throw error;
			}
			if (attempt >= maxAttempts) {
				throw error;
			}
			await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
			return this.withPgRetry(fn, attempt + 1, maxAttempts);
		}
	}
}
