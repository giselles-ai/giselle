import { db, githubRepositoryIndex } from "@/drizzle";
import {
	type GitHubChunkMetadata,
	createGitHubChunkStore,
} from "@/lib/vector-stores/github-blob-stores";
import {
	GitHubBlobLoader,
	type GitHubBlobMetadata,
} from "@giselle-sdk/github-tool";
import { createIngestPipeline } from "@giselle-sdk/rag2";
import type { Octokit } from "@octokit/core";
import { and, eq } from "drizzle-orm";

/**
 * Main GitHub repository ingestion coordination
 */
export async function ingestGitHubRepository(params: {
	octokitClient: Octokit;
	source: { owner: string; repo: string; commitSha: string };
	teamDbId: number;
}): Promise<void> {
	const repositoryIndexDbId = await getRepositoryIndexDbId(
		params.source,
		params.teamDbId,
	);

	const githubLoader = new GitHubBlobLoader(params.octokitClient, {
		maxBlobSize: 1 * 1024 * 1024,
	});
	const chunkStore = createGitHubChunkStore(repositoryIndexDbId);

	const pipeline = createIngestPipeline<
		GitHubBlobMetadata,
		GitHubChunkMetadata
	>({
		documentLoader: githubLoader,
		chunkStore,
		documentKey: (document) => document.metadata.path,
		metadataTransform: (metadata: GitHubBlobMetadata): GitHubChunkMetadata => ({
			repositoryIndexDbId,
			commitSha: metadata.commitSha,
			fileSha: metadata.fileSha,
			path: metadata.path,
			nodeId: metadata.nodeId,
		}),
		options: {
			maxBatchSize: 50,
			onProgress: (progress) => {
				console.log(
					`Ingesting... (${progress.processedDocuments}) ${progress.currentDocument}`,
				);
			},
		},
	});

	const result = await pipeline.ingest(params.source);
	console.log(
		`Ingested from ${result.totalDocuments} documents with success: ${result.successfulDocuments}, failure: ${result.failedDocuments}`,
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
