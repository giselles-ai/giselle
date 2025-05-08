import {
	db,
	githubRepositoryEmbeddings,
	githubRepositoryIndex,
} from "@/drizzle";
import { githubVectorStoreFlag } from "@/flags";
import { buildAppInstallationClient } from "@/services/external/github";
import {
	type EmbeddingStore,
	type GitHubBlobEmbedding,
	type GitHubBlobEmbeddingKey,
	ingestBlobs,
} from "@giselle-sdk/github-vector-store";
import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

// ingest GitHub Code
// TODO: implement as a cron job
export async function GET(request: NextRequest) {
	const isEnabled = await githubVectorStoreFlag();
	if (!isEnabled) {
		return new Response("Vector store is disabled", { status: 400 });
	}

	const targetGitHubRepositories = await fetchTargetGitHubRepositories();
	const embeddingStore = new EmbeddingStoreImpl();

	for (const targetGitHubRepository of targetGitHubRepositories) {
		const { owner, repo, installationId, lastIngestedCommitSha } =
			targetGitHubRepository;
		const octokit = await createOctokit(installationId);

		await ingestBlobs({
			owner,
			repo,
			lastIngestedCommitSha,
			dependencies: {
				octokit,
				embeddingStore,
			},
		});
	}

	return new Response("ok", { status: 200 });
}

async function createOctokit(installationId: number) {
	return buildAppInstallationClient(installationId);
}

type TargetGitHubRepository = {
	owner: string;
	repo: string;
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
		})
		.from(githubRepositoryIndex)
		.where(eq(githubRepositoryIndex.status, "idle"));

	return records.map((record) => ({
		owner: record.owner,
		repo: record.repo,
		installationId: record.installationId,
		lastIngestedCommitSha: record.lastIngestedCommitSha,
	}));
}

class EmbeddingStoreImpl implements EmbeddingStore {
	private async getRepositoryIndexDbId(owner: string, repo: string) {
		const records = await db
			.select({ dbId: githubRepositoryIndex.dbId })
			.from(githubRepositoryIndex)
			.where(
				and(
					eq(githubRepositoryIndex.owner, owner),
					eq(githubRepositoryIndex.repo, repo),
				),
			)
			.limit(1);
		const repositoryIndex = records[0];
		if (repositoryIndex == null) {
			throw new Error(`Repository index not found: ${owner}/${repo}`);
		}
		return repositoryIndex.dbId;
	}

	async insert(data: GitHubBlobEmbedding) {
		const repositoryIndexDbId = await this.getRepositoryIndexDbId(
			data.owner,
			data.repo,
		);
		await db.insert(githubRepositoryEmbeddings).values({
			repositoryIndexDbId,
			commitSha: data.commitSha,
			fileSha: data.fileSha,
			path: data.path,
			nodeId: data.nodeId,
			embedding: data.embedding,
			chunkIndex: data.chunkIndex,
			chunkContent: data.chunkContent,
		});
	}

	async delete(key: GitHubBlobEmbeddingKey) {
		const repositoryIndexDbId = await this.getRepositoryIndexDbId(
			key.owner,
			key.repo,
		);
		await db
			.delete(githubRepositoryEmbeddings)
			.where(
				and(
					eq(
						githubRepositoryEmbeddings.repositoryIndexDbId,
						repositoryIndexDbId,
					),
					eq(githubRepositoryEmbeddings.path, key.path),
				),
			);
	}

	async update(data: GitHubBlobEmbedding) {
		this.delete(data);
		this.insert(data);
	}
}
