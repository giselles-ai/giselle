import {
	createGitHubPullRequestsLoader,
	type GitHubAuthConfig,
} from "@giselle-sdk/github-tool";
import type { EmbeddingProfileId } from "@giselle-sdk/rag";
import { createPipeline } from "@giselle-sdk/rag";
import type { TelemetrySettings } from "ai";
import { and, eq } from "drizzle-orm";
import {
	db,
	type GitHubPullRequestDocumentKey,
	githubRepositoryContentStatus,
	githubRepositoryIndex,
} from "@/drizzle";
import { handleIngestErrors } from "../error-handling";
import { createGitHubPullRequestChunkStore } from "./chunk-store";

/**
 * Ingest GitHub Pull Requests into the vector store
 */
export async function ingestGitHubPullRequests(params: {
	githubAuthConfig: GitHubAuthConfig;
	source: { owner: string; repo: string };
	teamDbId: number;
	embeddingProfileId: EmbeddingProfileId;
	telemetry?: TelemetrySettings;
}): Promise<void> {
	const { repositoryIndexDbId } = await getRepositoryIndexInfo(
		params.source,
		params.teamDbId,
	);
	const documentLoader = createGitHubPullRequestsLoader(
		params.source,
		params.githubAuthConfig,
	);
	const chunkStore = createGitHubPullRequestChunkStore(
		repositoryIndexDbId,
		params.embeddingProfileId,
	);

	const ingest = createPipeline({
		documentLoader,
		chunkStore,
		documentKey: (metadata) => {
			const { prNumber, contentType, contentId } = metadata;
			const documentKey: GitHubPullRequestDocumentKey = `${prNumber}:${contentType}:${contentId}`;
			return documentKey;
		},
		documentVersion: (metadata) => new Date(metadata.mergedAt).toISOString(),
		metadataTransform: (metadata) => ({
			repositoryIndexDbId,
			contentId: metadata.contentId,
			contentType: metadata.contentType,
			mergedAt: new Date(metadata.mergedAt),
			prNumber: metadata.prNumber,
		}),
		embeddingProfileId: params.embeddingProfileId,
		telemetry: params.telemetry,
	});

	const result = await ingest();
	console.log(
		`Ingested from ${result.totalDocuments} documents with success: ${result.successfulDocuments}, failure: ${result.failedDocuments}`,
	);

	// Capture errors to Sentry if any documents failed
	handleIngestErrors(result, params, "pull request");
}

/**
 * Get repository index info
 */
async function getRepositoryIndexInfo(
	source: { owner: string; repo: string },
	teamDbId: number,
): Promise<{ repositoryIndexDbId: number }> {
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
				eq(githubRepositoryContentStatus.contentType, "pull_request"),
			),
		)
		.where(
			and(
				eq(githubRepositoryIndex.owner, source.owner),
				eq(githubRepositoryIndex.repo, source.repo),
				eq(githubRepositoryIndex.teamDbId, teamDbId),
				eq(githubRepositoryContentStatus.enabled, true),
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
			`Pull request content status not found for repository: ${source.owner}/${source.repo}`,
		);
	}

	return { repositoryIndexDbId: dbId };
}
