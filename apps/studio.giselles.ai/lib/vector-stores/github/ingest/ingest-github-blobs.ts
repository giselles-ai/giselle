import {
	createGitHubArchiveLoader,
	createGitHubTreeLoader,
} from "@giselle-sdk/github-tool";
import { createPipeline } from "@giselle-sdk/rag";
import type { Octokit } from "@octokit/core";
import type { TelemetrySettings } from "ai";
import { and, eq } from "drizzle-orm";
import {
	db,
	githubRepositoryContentStatus,
	githubRepositoryIndex,
} from "@/drizzle";
import { safeParseContentStatusMetadata } from "../types";
import { createGitHubBlobChunkStore } from "./chunk-store";

/**
 * Ingest GitHub blobs into the vector store
 * Uses different loaders based on whether this is an initial ingest
 */
export async function ingestGitHubBlobs(params: {
	octokitClient: Octokit;
	source: { owner: string; repo: string; commitSha: string };
	teamDbId: number;
	telemetry?: TelemetrySettings;
}): Promise<void> {
	const { repositoryIndexDbId, isInitialIngest } = await getRepositoryIndexInfo(
		params.source,
		params.teamDbId,
	);

	const githubLoader = isInitialIngest
		? createGitHubArchiveLoader(params.octokitClient, params.source, {
				maxBlobSize: 1 * 1024 * 1024,
			})
		: createGitHubTreeLoader(params.octokitClient, params.source, {
				maxBlobSize: 1 * 1024 * 1024,
			});
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
		telemetry: params.telemetry,
	});

	const result = await ingest();
	console.log(
		`Ingested from ${result.totalDocuments} documents with success: ${result.successfulDocuments}, failure: ${result.failedDocuments}`,
	);
}

/**
 * Get repository index info including whether this is an initial ingest
 */
async function getRepositoryIndexInfo(
	source: { owner: string; repo: string },
	teamDbId: number,
): Promise<{ repositoryIndexDbId: number; isInitialIngest: boolean }> {
	const result = await db
		.select({
			dbId: githubRepositoryIndex.dbId,
			contentStatus: githubRepositoryContentStatus,
		})
		.from(githubRepositoryIndex)
		.leftJoin(
			githubRepositoryContentStatus,
			and(
				eq(
					githubRepositoryContentStatus.repositoryIndexDbId,
					githubRepositoryIndex.dbId,
				),
				eq(githubRepositoryContentStatus.contentType, "blob"),
			),
		)
		.where(
			and(
				eq(githubRepositoryIndex.owner, source.owner),
				eq(githubRepositoryIndex.repo, source.repo),
				eq(githubRepositoryIndex.teamDbId, teamDbId),
			),
		)
		.limit(1);

	if (result.length === 0) {
		throw new Error(
			`Repository index not found: ${source.owner}/${source.repo}`,
		);
	}

	const { dbId, contentStatus } = result[0];
	if (!contentStatus) {
		throw new Error(
			`Blob content status not found for repository: ${source.owner}/${source.repo}`,
		);
	}
	const parseResult = safeParseContentStatusMetadata(
		contentStatus.metadata,
		contentStatus.contentType,
	);

	// If parsing fails or no lastIngestedCommitSha exists, treat as initial ingest
	const isInitialIngest =
		!parseResult.success ||
		!parseResult.data ||
		!parseResult.data.lastIngestedCommitSha;

	return { repositoryIndexDbId: dbId, isInitialIngest };
}
