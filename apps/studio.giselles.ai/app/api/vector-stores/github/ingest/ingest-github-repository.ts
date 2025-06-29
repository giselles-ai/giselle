import { db, githubRepositoryIndex } from "@/drizzle";
import { createGitHubBlobChunkStore } from "@/lib/vector-stores/github-blob-stores";
import { createGitHubBlobLoader } from "@giselle-sdk/github-tool";
import { createPipeline } from "@giselle-sdk/rag";
import type { Octokit } from "@octokit/core";
import { and, eq } from "drizzle-orm";

/**
 * Main GitHub repository ingestion coordination
 */
export async function ingestGitHubBlobs(params: {
	octokitClient: Octokit;
	source: { owner: string; repo: string; commitSha: string };
	teamDbId: number;
}): Promise<void> {
	const repositoryIndexDbId = await getRepositoryIndexDbId(
		params.source,
		params.teamDbId,
	);

	const githubLoader = createGitHubBlobLoader(
		params.octokitClient,
		params.source,
		{ maxBlobSize: 1 * 1024 * 1024 },
	);
	const chunkStore = createGitHubBlobChunkStore(repositoryIndexDbId);

	const ingest = createPipeline({
		documentLoader: githubLoader,
		chunkStore,
		documentKey: (metadata) => metadata.path,
		documentVersion: (metadata) => metadata.fileSha,
		metadataTransform: (metadata) => ({
			repositoryIndexDbId,
			fileSha: metadata.fileSha,
			path: metadata.path,
		}),
	});

	const result = await ingest();
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
