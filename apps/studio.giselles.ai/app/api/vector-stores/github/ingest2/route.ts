import {
	db,
	githubRepositoryEmbeddings,
	githubRepositoryIndex,
} from "@/drizzle";
import {
	type GitHubBlobMetadata,
	gitHubBlobMetadataSchema,
} from "@/lib/github-schema";
import {
	GitHubDocumentLoader,
	fetchDefaultBranchHead,
	octokit,
} from "@giselle-sdk/github-tool";
import {
	type DatabaseConfig,
	type Document,
	type DocumentLoader,
	createChunkStore,
	createIngestPipeline,
} from "@giselle/rag3";
import type { Octokit } from "@octokit/core";
import { captureException } from "@sentry/nextjs";
import { and, eq, getTableName } from "drizzle-orm";
import type { NextRequest } from "next/server";

export const maxDuration = 800;

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response("Unauthorized", {
			status: 401,
		});
	}

	const targetGitHubRepositories = await fetchTargetGitHubRepositories();

	for (const targetGitHubRepository of targetGitHubRepositories) {
		const { owner, repo, installationId, teamDbId } = targetGitHubRepository;

		try {
			// Update status to running
			await updateRepositoryStatus(owner, repo, "running");

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

			const commit = await fetchDefaultBranchHead(octokitClient, owner, repo);

			const source = {
				owner,
				repo,
				commitSha: commit.sha,
			};

			await ingestGitHubRepository({
				octokitClient,
				source,
				teamDbId,
			});

			// Update status to completed
			await updateRepositoryStatus(owner, repo, "completed", commit.sha);
		} catch (error) {
			console.error(`Failed to ingest ${owner}/${repo}:`, error);
			captureException(error, {
				extra: { owner, repo },
			});
			await updateRepositoryStatus(owner, repo, "failed");
		}
	}

	return new Response("ok", { status: 200 });
}

/**
 * GitHubDocumentLoader のメタデータを GitHubBlobMetadata に変換するアダプター
 */
class GitHubMetadataAdapter implements DocumentLoader<GitHubBlobMetadata> {
	constructor(
		private loader: GitHubDocumentLoader,
		private repositoryIndexDbId: number,
	) {}

	async *load(params: {
		owner: string;
		repo: string;
		commitSha: string;
	}): AsyncIterable<Document<GitHubBlobMetadata>> {
		for await (const doc of this.loader.load(params)) {
			// GitHubDocumentMetadata を GitHubBlobMetadata に変換
			const metadata: GitHubBlobMetadata = {
				repositoryIndexDbId: this.repositoryIndexDbId,
				commitSha: doc.metadata.commitSha,
				fileSha: doc.metadata.fileSha,
				path: doc.metadata.path,
				nodeId: doc.metadata.nodeId,
			};

			yield {
				content: doc.content,
				metadata,
			};
		}
	}
}

/**
 * Main GitHub repository ingestion coordination
 */
async function ingestGitHubRepository(params: {
	octokitClient: Octokit;
	source: { owner: string; repo: string; commitSha: string };
	teamDbId: number;
}): Promise<void> {
	const repositoryIndexDbId = await getRepositoryIndexDbId(
		params.source,
		params.teamDbId,
	);

	// Create database config
	const postgresUrl = process.env.POSTGRES_URL;
	if (!postgresUrl) {
		throw new Error("POSTGRES_URL environment variable is required");
	}
	const database: DatabaseConfig = { connectionString: postgresUrl };

	// GitHub document loader
	const githubLoader = new GitHubDocumentLoader(params.octokitClient, {
		maxBlobSize: 1 * 1024 * 1024,
	});

	// Adapter to convert metadata
	const documentLoader = new GitHubMetadataAdapter(
		githubLoader,
		repositoryIndexDbId,
	);

	const chunkStore = createChunkStore<GitHubBlobMetadata>({
		database,
		tableName: getTableName(githubRepositoryEmbeddings),
		metadataSchema: gitHubBlobMetadataSchema,
		staticContext: { repository_index_db_id: repositoryIndexDbId },
		requiredColumnOverrides: {
			documentKey: "path",
			content: "chunk_content",
			index: "chunk_index",
			// embedding: "embedding" (default)
		},
		// Metadata fields will auto-convert from camelCase to snake_case:
		// repositoryIndexDbId -> repository_index_db_id
		// commitSha -> commit_sha
		// fileSha -> file_sha
		// path -> path
		// nodeId -> node_id
	});

	// 簡素化されたパイプライン作成（chunker/embedderの詳細を隠蔽）
	const pipeline = createIngestPipeline({
		documentLoader,
		chunkStore,
		options: {
			batchSize: 50,
			onProgress: (progress) => {
				console.log(
					`Progress: ${progress.processedDocuments}/${progress.totalDocuments} documents`,
				);
			},
		},
	});

	const result = await pipeline.ingest(params.source);
	console.log(
		`Ingested ${result.totalChunks} chunks from ${result.totalDocuments} documents`,
	);
}

/**
 * Get repository index database ID
 */
async function getRepositoryIndexDbId(
	source: { owner: string; repo: string },
	teamDbId: number,
): Promise<number> {
	const repositoryIndex = await db
		.select({ dbId: githubRepositoryIndex.dbId })
		.from(githubRepositoryIndex)
		.where(
			and(
				eq(githubRepositoryIndex.owner, source.owner),
				eq(githubRepositoryIndex.repo, source.repo),
				eq(githubRepositoryIndex.teamDbId, teamDbId),
			),
		)
		.limit(1);

	if (repositoryIndex.length === 0) {
		throw new Error(
			`Repository index not found: ${source.owner}/${source.repo}`,
		);
	}

	return repositoryIndex[0].dbId;
}

// ===== HELPER FUNCTIONS =====

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
 * Update the ingestion status of a repository
 */
async function updateRepositoryStatus(
	owner: string,
	repo: string,
	status: "idle" | "running" | "failed" | "completed",
	commitSha?: string,
): Promise<void> {
	await db
		.update(githubRepositoryIndex)
		.set({
			status,
			lastIngestedCommitSha: commitSha || null,
		})
		.where(
			and(
				eq(githubRepositoryIndex.owner, owner),
				eq(githubRepositoryIndex.repo, repo),
			),
		);
}
