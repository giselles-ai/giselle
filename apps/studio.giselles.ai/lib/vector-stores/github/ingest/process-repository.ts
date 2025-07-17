import { fetchDefaultBranchHead } from "@giselle-sdk/github-tool";
import { DocumentLoaderError, RagError } from "@giselle-sdk/rag";
import { captureException } from "@sentry/nextjs";
import { and, eq } from "drizzle-orm";
import { db, githubRepositoryContentStatus } from "@/drizzle";
import type { TargetGitHubRepository } from "../types";
import { buildOctokit } from "./build-octokit";
import { createBlobContentMetadata } from "./content-metadata-schema";
import { ingestGitHubBlobs } from "./ingest-github-blobs";
import { createIngestTelemetrySettings } from "./telemetry";

/**
 * Process a GitHub repository for ingestion
 * This is the main entry point for ingesting a repository
 */
export async function processRepository(
	targetGitHubRepository: TargetGitHubRepository,
) {
	const { owner, repo, installationId, teamDbId, dbId } =
		targetGitHubRepository;

	try {
		await updateRepositoryStatusToRunning(dbId);

		const octokitClient = buildOctokit(installationId);
		const commit = await fetchDefaultBranchHead(octokitClient, owner, repo);
		const source = {
			owner,
			repo,
			commitSha: commit.sha,
		};

		const telemetry = await createIngestTelemetrySettings(
			teamDbId,
			`${owner}/${repo}`,
		);

		await ingestGitHubBlobs({
			octokitClient,
			source,
			teamDbId,
			telemetry,
		});

		await updateRepositoryStatusToCompleted(dbId, commit.sha);
	} catch (error) {
		console.error(
			`Failed to ingest GitHub Repository: teamDbId=${teamDbId}, repository=${owner}/${repo}`,
			error,
		);

		const { errorCode, retryAfter } = extractErrorInfo(error);

		captureException(error, {
			extra: {
				owner,
				repo,
				teamDbId,
				errorCode,
				retryAfter,
				errorContext:
					error instanceof DocumentLoaderError ? error.context : undefined,
			},
		});

		await updateRepositoryStatusToFailed(dbId, {
			errorCode,
			retryAfter,
		});
	}
}

/**
 * Extract error code and retry time from an error
 * @param error The error to extract information from
 * @returns Error code and retry time
 */
function extractErrorInfo(error: unknown): {
	errorCode: string;
	retryAfter: Date | null;
} {
	if (error instanceof DocumentLoaderError) {
		const errorCode = error.code;

		let retryAfter: Date | null;
		switch (error.code) {
			case "DOCUMENT_NOT_FOUND":
			case "DOCUMENT_TOO_LARGE":
				// Not retryable
				retryAfter = null;
				break;
			case "DOCUMENT_RATE_LIMITED":
				retryAfter = error.getRetryAfterDate() ?? new Date();
				break;
			case "DOCUMENT_FETCH_ERROR":
				retryAfter = new Date();
				break;
			default: {
				const _exhaustiveCheck: never = error.code;
				throw new Error(`Unknown error code: ${_exhaustiveCheck}`);
			}
		}

		return { errorCode, retryAfter };
	}

	if (error instanceof RagError) {
		return {
			errorCode: error.code,
			retryAfter: new Date(),
		};
	}

	return {
		errorCode: "UNKNOWN",
		retryAfter: new Date(),
	};
}

/**
 * Update repository blob content status to running
 */
async function updateRepositoryStatusToRunning(dbId: number) {
	// Ensure content status record exists
	const [existing] = await db
		.select()
		.from(githubRepositoryContentStatus)
		.where(
			and(
				eq(githubRepositoryContentStatus.repositoryIndexDbId, dbId),
				eq(githubRepositoryContentStatus.contentType, "blob"),
			),
		)
		.limit(1);

	if (!existing) {
		throw new Error(
			`Blob content status not found for repository dbId: ${dbId}`,
		);
	}

	await db
		.update(githubRepositoryContentStatus)
		.set({
			status: "running",
		})
		.where(
			and(
				eq(githubRepositoryContentStatus.repositoryIndexDbId, dbId),
				eq(githubRepositoryContentStatus.contentType, "blob"),
			),
		);
}

/**
 * Update repository blob content status to completed
 */
async function updateRepositoryStatusToCompleted(
	dbId: number,
	commitSha: string,
) {
	await db
		.update(githubRepositoryContentStatus)
		.set({
			status: "completed",
			metadata: createBlobContentMetadata({
				lastIngestedCommitSha: commitSha,
			}),
			lastSyncedAt: new Date(),
			// clear error info
			errorCode: null,
			retryAfter: null,
		})
		.where(
			and(
				eq(githubRepositoryContentStatus.repositoryIndexDbId, dbId),
				eq(githubRepositoryContentStatus.contentType, "blob"),
			),
		);
}

/**
 * Update repository blob content status to failed
 */
async function updateRepositoryStatusToFailed(
	dbId: number,
	errorInfo: {
		errorCode: string;
		retryAfter: Date | null;
	},
) {
	await db
		.update(githubRepositoryContentStatus)
		.set({
			status: "failed",
			errorCode: errorInfo.errorCode,
			retryAfter: errorInfo.retryAfter,
		})
		.where(
			and(
				eq(githubRepositoryContentStatus.repositoryIndexDbId, dbId),
				eq(githubRepositoryContentStatus.contentType, "blob"),
			),
		);
}
