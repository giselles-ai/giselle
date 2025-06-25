import { createGitHubBlobChunkStore } from "@/lib/vector-stores/github-blob-stores";
import { createGitHubBlobLoader } from "@giselle-sdk/github-tool";
import { createPipeline } from "@giselle-sdk/rag";
import type { Octokit } from "@octokit/core";

/**
 * Main GitHub repository ingestion coordination
 */
export async function ingestGitHubBlobs(params: {
	octokitClient: Octokit;
	source: { owner: string; repo: string; commitSha: string };
	repositoryIndexDbId: number;
}): Promise<void> {
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

	const ingest = createPipeline({
		documentLoader: githubLoader,
		chunkStore,
		documentKey: (metadata) => metadata.path,
		documentVersion: (metadata) => metadata.fileSha,
		metadataTransform: (metadata) => ({
			repositoryIndexDbId: params.repositoryIndexDbId,
			commitSha: metadata.commitSha,
			fileSha: metadata.fileSha,
			path: metadata.path,
			nodeId: metadata.nodeId,
		}),
	});

	const result = await ingest();
	console.log(
		`Ingested from ${result.totalDocuments} documents with success: ${result.successfulDocuments}, failure: ${result.failedDocuments}`,
	);
}
