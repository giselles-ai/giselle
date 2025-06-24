import { db, githubRepositoryEmbeddings } from "@/drizzle";
import { createGitHubBlobChunkStore } from "@/lib/vector-stores/github-blob-stores";
import { createGitHubBlobLoader } from "@giselle-sdk/github-tool";
import { createIngestPipeline } from "@giselle-sdk/rag";
import type { Octokit } from "@octokit/core";
import { eq } from "drizzle-orm";

/**
 * Main GitHub repository ingestion coordination
 */
export async function ingestGitHubBlobs(params: {
	octokitClient: Octokit;
	source: { owner: string; repo: string; commitSha: string };
	repositoryIndexDbId: number;
}): Promise<void> {
	const processedFiles = await loadProcessedFiles(params.repositoryIndexDbId);
	const githubLoader = createGitHubBlobLoader(
		params.octokitClient,
		{
			owner: params.source.owner,
			repo: params.source.repo,
			commitSha: params.source.commitSha,
		},
		{
			maxBlobSize: 1 * 1024 * 1024,
		},
	);
	const chunkStore = createGitHubBlobChunkStore(params.repositoryIndexDbId);

	const ingest = createIngestPipeline({
		documentLoader: githubLoader,
		chunkStore,
		documentKey: (metadata) => metadata.path,
		metadataTransform: (metadata) => ({
			repositoryIndexDbId: params.repositoryIndexDbId,
			commitSha: metadata.commitSha,
			fileSha: metadata.fileSha,
			path: metadata.path,
			nodeId: metadata.nodeId,
		}),
		shouldSkip: (metadata) => {
			const existingFileSha = processedFiles.get(metadata.path);
			return existingFileSha === metadata.fileSha;
		},
	});

	const result = await ingest();
	console.log(
		`Ingested from ${result.totalDocuments} documents with success: ${result.successfulDocuments}, failure: ${result.failedDocuments}`,
	);
}

/**
 * Load processed files with their fileSha for fast lookup
 */
async function loadProcessedFiles(
	repositoryIndexDbId: number,
): Promise<Map<string, string>> {
	const result = await db
		.selectDistinct({
			path: githubRepositoryEmbeddings.path,
			fileSha: githubRepositoryEmbeddings.fileSha,
		})
		.from(githubRepositoryEmbeddings)
		.where(
			eq(githubRepositoryEmbeddings.repositoryIndexDbId, repositoryIndexDbId),
		);

	return new Map(result.map((r) => [r.path, r.fileSha]));
}
