import type { EmbeddingProfileId } from "@giselle-sdk/data-type";
import {
	createGitHubIssuesLoader,
	type GitHubAuthConfig,
} from "@giselle-sdk/github-tool";
import {
	createPipeline,
	type EmbeddingCompleteCallback,
} from "@giselle-sdk/rag";
import { and, eq } from "drizzle-orm";
import { db, githubRepositoryContentStatus, githubRepositoryIndex } from "@/db";
import { handleIngestErrors } from "../error-handling";
import { createGitHubIssueChunkStore } from "./chunk-store";

/**
 * Ingest GitHub Issues into the vector store
 */
export async function ingestGitHubIssues(params: {
	githubAuthConfig: GitHubAuthConfig;
	source: { owner: string; repo: string };
	teamDbId: number;
	embeddingProfileId: EmbeddingProfileId;
	embeddingComplete?: EmbeddingCompleteCallback;
}): Promise<void> {
	const { repositoryIndexDbId } = await getRepositoryIndexInfo(
		params.source,
		params.teamDbId,
		params.embeddingProfileId,
	);
	const documentLoader = createGitHubIssuesLoader(
		params.source,
		params.githubAuthConfig,
	);
	const chunkStore = createGitHubIssueChunkStore(
		repositoryIndexDbId,
		params.embeddingProfileId,
	);

	const ingest = createPipeline({
		documentLoader,
		chunkStore,
		documentKey: ({ issueNumber, contentType, contentId }) =>
			`${issueNumber}:${contentType}:${contentId}`,
		documentVersion: ({ contentEditedAt }) =>
			new Date(contentEditedAt).toISOString(),
		metadataTransform: ({
			issueNumber,
			issueState,
			issueStateReason,
			issueUpdatedAt,
			issueClosedAt,
			contentType,
			contentId,
			contentCreatedAt,
			contentEditedAt,
		}) => {
			return {
				repositoryIndexDbId,
				issueNumber,
				issueState,
				issueStateReason,
				issueUpdatedAt: new Date(issueUpdatedAt),
				issueClosedAt: issueClosedAt ? new Date(issueClosedAt) : null,
				contentType,
				contentId,
				contentCreatedAt: new Date(contentCreatedAt),
				contentEditedAt: contentEditedAt ? new Date(contentEditedAt) : null,
			};
		},
		embeddingProfileId: params.embeddingProfileId,
		embeddingComplete: params.embeddingComplete,
	});

	const result = await ingest();
	console.log(
		`Ingested from ${result.totalDocuments} documents with success: ${result.successfulDocuments}, failure: ${result.failedDocuments}`,
	);

	// Capture errors to Sentry if any documents failed
	handleIngestErrors(result, params, "issue");
}

/**
 * Get repository index info
 */
async function getRepositoryIndexInfo(
	source: { owner: string; repo: string },
	teamDbId: number,
	embeddingProfileId: EmbeddingProfileId,
): Promise<{ repositoryIndexDbId: number }> {
	const [repositoryIndexRecord] = await db
		.select({ dbId: githubRepositoryIndex.dbId })
		.from(githubRepositoryIndex)
		.where(
			and(
				eq(githubRepositoryIndex.owner, source.owner),
				eq(githubRepositoryIndex.repo, source.repo),
				eq(githubRepositoryIndex.teamDbId, teamDbId),
			),
		);

	if (!repositoryIndexRecord) {
		throw new Error(
			`Repository index not found: teamDbId=${teamDbId}, repository=${source.owner}/${source.repo}`,
		);
	}

	const repositoryIndexDbId = repositoryIndexRecord.dbId;

	// Verify content status exists
	const [contentStatusRecord] = await db
		.select()
		.from(githubRepositoryContentStatus)
		.where(
			and(
				eq(
					githubRepositoryContentStatus.repositoryIndexDbId,
					repositoryIndexDbId,
				),
				eq(githubRepositoryContentStatus.contentType, "issue"),
				eq(
					githubRepositoryContentStatus.embeddingProfileId,
					embeddingProfileId,
				),
			),
		);

	if (!contentStatusRecord) {
		throw new Error(
			`Content status not found: repositoryIndexDbId=${repositoryIndexDbId}, contentType=issue, embeddingProfileId=${embeddingProfileId}`,
		);
	}

	return { repositoryIndexDbId };
}
