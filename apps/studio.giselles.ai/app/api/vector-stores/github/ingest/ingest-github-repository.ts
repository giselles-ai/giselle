import {
	db,
	githubRepositoryEmbeddings,
	githubRepositoryIndex,
} from "@/drizzle";
import { createGitHubBlobChunkStore } from "@/lib/vector-stores/github-blob-stores";
import { createGitHubBlobLoader } from "@giselle-sdk/github-tool";
import { createIngestPipeline } from "@giselle-sdk/rag";
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

	// Load processed paths into memory for fast lookup
	const processedPaths = await loadProcessedPaths(
		repositoryIndexDbId,
		params.source.commitSha,
	);

	const githubLoader = createGitHubBlobLoader(params.octokitClient, {
		maxBlobSize: 1 * 1024 * 1024,
		shouldSkip: (path) => processedPaths.has(path),
	});
	const chunkStore = createGitHubBlobChunkStore(repositoryIndexDbId);

	const ingest = createIngestPipeline({
		documentLoader: githubLoader,
		chunkStore,
		documentKey: (document) => document.metadata.path,
		metadataTransform: (metadata) => ({
			repositoryIndexDbId,
			commitSha: metadata.commitSha,
			fileSha: metadata.fileSha,
			path: metadata.path,
			nodeId: metadata.nodeId,
		}),
	});

	const result = await ingest(params.source);
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

/**
 * Load processed file paths into memory for fast lookup
 */
async function loadProcessedPaths(
	repositoryIndexDbId: number,
	commitSha: string,
): Promise<Set<string>> {
	const result = await db
		.selectDistinct({ path: githubRepositoryEmbeddings.path })
		.from(githubRepositoryEmbeddings)
		.where(
			and(
				eq(githubRepositoryEmbeddings.repositoryIndexDbId, repositoryIndexDbId),
				eq(githubRepositoryEmbeddings.commitSha, commitSha),
			),
		);

	return new Set(result.map((r) => r.path));
}
