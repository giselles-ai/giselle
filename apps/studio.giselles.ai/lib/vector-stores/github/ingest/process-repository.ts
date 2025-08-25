import { fetchDefaultBranchHead } from "@giselle-sdk/github-tool";
import { DocumentLoaderError, RagError } from "@giselle-sdk/rag";
import { captureException } from "@sentry/nextjs";
import type { TelemetrySettings } from "ai";
import { and, eq, max } from "drizzle-orm";
import {
	db,
	type GitHubRepositoryContentType,
	githubRepositoryContentStatus,
	type githubRepositoryIndex,
	githubRepositoryPullRequestEmbeddings,
} from "@/drizzle";
import { getEnabledEmbeddingProfiles } from "../embedding-profiles";
import type { RepositoryWithStatuses } from "../types";
import { createBlobMetadata, createPullRequestMetadata } from "../types";
import { ingestGitHubBlobs } from "./blobs/ingest-github-blobs";
import { buildGitHubAuthConfig, buildOctokit } from "./build-octokit";
import { ingestGitHubPullRequests } from "./pull-requests/ingest-github-pull-requests";
import { createIngestTelemetrySettings } from "./telemetry";

type ProcessorConfig = {
	repositoryIndex: typeof githubRepositoryIndex.$inferSelect;
	telemetry?: TelemetrySettings;
};

type ContentProcessor = (config: ProcessorConfig) => Promise<{
	metadata:
		| ReturnType<typeof createBlobMetadata>
		| ReturnType<typeof createPullRequestMetadata>;
}>;

const CONTENT_PROCESSORS: Record<
	GitHubRepositoryContentType,
	ContentProcessor
> = {
	blob: async ({ repositoryIndex, telemetry }) => {
		const { owner, repo, installationId, teamDbId, dbId } = repositoryIndex;
		const octokit = buildOctokit(installationId);
		const commit = await fetchDefaultBranchHead(octokit, owner, repo);

		const enabledEmbeddingProfiles = await getEnabledEmbeddingProfiles(dbId);
		for (const profileId of enabledEmbeddingProfiles) {
			await ingestGitHubBlobs({
				octokitClient: octokit,
				source: { owner, repo, commitSha: commit.sha },
				teamDbId,
				embeddingProfileId: profileId,
				telemetry,
			});
		}

		return {
			metadata: createBlobMetadata({ lastIngestedCommitSha: commit.sha }),
		};
	},

	pull_request: async ({ repositoryIndex, telemetry }) => {
		const { owner, repo, installationId, teamDbId, dbId } = repositoryIndex;

		const enabledEmbeddingProfiles = await getEnabledEmbeddingProfiles(dbId);
		for (const profileId of enabledEmbeddingProfiles) {
			await ingestGitHubPullRequests({
				githubAuthConfig: buildGitHubAuthConfig(installationId),
				source: { owner, repo },
				teamDbId,
				embeddingProfileId: profileId,
				telemetry,
			});
		}

		const lastPrNumber = await getLastIngestedPrNumber(dbId);
		return {
			metadata: createPullRequestMetadata({
				lastIngestedPrNumber: lastPrNumber ?? undefined,
			}),
		};
	},
};

/**
 * Process a GitHub repository for ingestion
 */
export async function processRepository(
	repositoryData: RepositoryWithStatuses,
) {
	const { repositoryIndex, contentStatuses } = repositoryData;
	const { owner, repo, teamDbId } = repositoryIndex;

	const telemetry = await createIngestTelemetrySettings(
		teamDbId,
		`${owner}/${repo}`,
	);

	for (const contentStatus of contentStatuses) {
		if (!contentStatus.enabled) {
			continue;
		}

		try {
			await updateContentStatus(
				repositoryIndex.dbId,
				contentStatus.contentType,
				{
					status: "running",
				},
			);

			const processor = CONTENT_PROCESSORS[contentStatus.contentType];
			const { metadata } = await processor({ repositoryIndex, telemetry });

			await updateContentStatus(
				repositoryIndex.dbId,
				contentStatus.contentType,
				{
					...completedStatus(metadata),
				},
			);
		} catch (error) {
			console.error(
				`Failed to ingest ${contentStatus.contentType} for GitHub Repository: teamDbId=${teamDbId}, repository=${owner}/${repo}`,
				error,
			);

			const errorInfo = extractErrorInfo(error);

			captureException(error, {
				extra: {
					owner,
					repo,
					teamDbId,
					contentType: contentStatus.contentType,
					...errorInfo,
					errorContext:
						error instanceof DocumentLoaderError ? error.context : undefined,
				},
			});

			await updateContentStatus(
				repositoryIndex.dbId,
				contentStatus.contentType,
				{
					...failedStatus(errorInfo),
				},
			);
		}
	}
}

function completedStatus(
	metadata:
		| ReturnType<typeof createBlobMetadata>
		| ReturnType<typeof createPullRequestMetadata>,
) {
	return {
		status: "completed" as const,
		metadata,
		lastSyncedAt: new Date(),
		errorCode: null,
		retryAfter: null,
	};
}

function failedStatus({
	errorCode,
	retryAfter,
}: ReturnType<typeof extractErrorInfo>) {
	return {
		status: "failed" as const,
		errorCode,
		retryAfter,
	};
}

async function getLastIngestedPrNumber(repositoryIndexDbId: number) {
	const results = await db
		.select({
			lastIngestedPrNumber: max(githubRepositoryPullRequestEmbeddings.prNumber),
		})
		.from(githubRepositoryPullRequestEmbeddings)
		.where(
			and(
				eq(
					githubRepositoryPullRequestEmbeddings.repositoryIndexDbId,
					repositoryIndexDbId,
				),
			),
		);
	if (results.length === 0) {
		return null;
	}

	return results[0].lastIngestedPrNumber;
}

const ERROR_RETRY_CONFIG = {
	DOCUMENT_NOT_FOUND: null,
	DOCUMENT_TOO_LARGE: null,
	DOCUMENT_RATE_LIMITED: (e: DocumentLoaderError) =>
		e.getRetryAfterDate() ?? new Date(),
	DOCUMENT_FETCH_ERROR: () => new Date(),
} as const;

function extractErrorInfo(error: unknown): {
	errorCode: string;
	retryAfter: Date | null;
} {
	if (error instanceof DocumentLoaderError) {
		const retryFn = ERROR_RETRY_CONFIG[error.code];
		return {
			errorCode: error.code,
			retryAfter: typeof retryFn === "function" ? retryFn(error) : retryFn,
		};
	}

	if (error instanceof RagError) {
		return { errorCode: error.code, retryAfter: new Date() };
	}

	return { errorCode: "UNKNOWN", retryAfter: new Date() };
}

async function updateContentStatus(
	repositoryIndexDbId: number,
	contentType: GitHubRepositoryContentType,
	update: {
		status: "running" | "completed" | "failed";
		metadata?:
			| ReturnType<typeof createBlobMetadata>
			| ReturnType<typeof createPullRequestMetadata>;
		lastSyncedAt?: Date;
		errorCode?: string | null;
		retryAfter?: Date | null;
	},
) {
	await db
		.update(githubRepositoryContentStatus)
		.set(update)
		.where(
			and(
				eq(
					githubRepositoryContentStatus.repositoryIndexDbId,
					repositoryIndexDbId,
				),
				eq(githubRepositoryContentStatus.contentType, contentType),
			),
		);
}
