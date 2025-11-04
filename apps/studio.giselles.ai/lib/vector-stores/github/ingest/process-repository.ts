import type { EmbeddingProfileId } from "@giselle-ai/data-type";
import { fetchDefaultBranchHead } from "@giselle-ai/github-tool";
import { DocumentLoaderError, RagError } from "@giselle-ai/rag";
import { createId } from "@paralleldrive/cuid2";
import { captureException } from "@sentry/nextjs";
import { and, eq, max } from "drizzle-orm";
import {
	db,
	type GitHubRepositoryContentType,
	githubRepositoryContentStatus,
	type githubRepositoryIndex,
	githubRepositoryPullRequestEmbeddings,
	type UserId,
} from "@/db";
import type { TeamWithSubscription } from "@/services/teams";
import { fetchTeamByDbId } from "@/services/teams/fetch-team";
import type { RepositoryWithStatuses } from "../types";
import { createBlobMetadata, createPullRequestMetadata } from "../types";
import { ingestGitHubBlobs } from "./blobs/ingest-github-blobs";
import { buildGitHubAuthConfig, buildOctokit } from "./build-octokit";
import { createIngestEmbeddingCallback } from "./embedding-tracking";
import { ingestGitHubPullRequests } from "./pull-requests/ingest-github-pull-requests";

type IngestTriggerId = `ingtrg_${string}`;
function createIngestTriggerId(): IngestTriggerId {
	return `ingtrg_${createId()}`;
}
export type IngestTrigger = { id: IngestTriggerId } & (
	| { type: "cron" }
	| { type: "manual"; userId: UserId }
);
export function createCronIngestTrigger(): IngestTrigger {
	return { id: createIngestTriggerId(), type: "cron" as const };
}
export function createManualIngestTrigger(userId: UserId): IngestTrigger {
	return { id: createIngestTriggerId(), type: "manual" as const, userId };
}

type ProcessorConfig = {
	repositoryIndex: typeof githubRepositoryIndex.$inferSelect;
	embeddingProfileId: EmbeddingProfileId;
	trigger: IngestTrigger;
	team: TeamWithSubscription;
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
	blob: async ({ repositoryIndex, embeddingProfileId, trigger, team }) => {
		const { owner, repo, installationId, teamDbId } = repositoryIndex;
		const octokit = buildOctokit(installationId);
		const commit = await fetchDefaultBranchHead(octokit, owner, repo);

		const embeddingComplete = createIngestEmbeddingCallback({
			team,
			trigger,
			resource: {
				provider: "github",
				contentType: "blob",
				owner,
				repo,
			},
		});

		await ingestGitHubBlobs({
			octokitClient: octokit,
			source: { owner, repo, commitSha: commit.sha },
			teamDbId,
			embeddingProfileId,
			embeddingComplete,
		});

		return {
			metadata: createBlobMetadata({ lastIngestedCommitSha: commit.sha }),
		};
	},

	pull_request: async ({
		repositoryIndex,
		embeddingProfileId,
		trigger,
		team,
	}) => {
		const { owner, repo, installationId, teamDbId, dbId } = repositoryIndex;

		const embeddingComplete = createIngestEmbeddingCallback({
			team,
			trigger,
			resource: {
				provider: "github",
				contentType: "pullRequest",
				owner,
				repo,
			},
		});

		await ingestGitHubPullRequests({
			githubAuthConfig: buildGitHubAuthConfig(installationId),
			source: { owner, repo },
			teamDbId,
			embeddingProfileId,
			embeddingComplete,
		});

		const lastPrNumber = await getLastIngestedPrNumber(
			dbId,
			embeddingProfileId,
		);
		return {
			metadata: createPullRequestMetadata({
				lastIngestedPrNumber: lastPrNumber ?? undefined,
			}),
		};
	},

	issue: () =>
		Promise.reject(
			new DocumentLoaderError(
				"GitHub Issue ingestion is not implemented yet.",
				"DOCUMENT_NOT_FOUND",
			),
		),
};

/**
 * Process a GitHub repository for ingestion
 */
export async function processRepository(
	repositoryData: RepositoryWithStatuses,
	trigger: IngestTrigger,
) {
	const { repositoryIndex, contentStatuses } = repositoryData;
	const { owner, repo, teamDbId } = repositoryIndex;

	const team = await fetchTeamByDbId(teamDbId);
	if (!team) {
		throw new Error(`Team not found for dbId: ${teamDbId}`);
	}

	for (const contentStatus of contentStatuses) {
		if (!contentStatus.enabled) {
			continue;
		}

		try {
			await updateContentStatus(
				repositoryIndex.dbId,
				contentStatus.embeddingProfileId,
				contentStatus.contentType,
				{
					status: "running",
				},
			);

			const processor = CONTENT_PROCESSORS[contentStatus.contentType];
			const { metadata } = await processor({
				repositoryIndex,
				embeddingProfileId: contentStatus.embeddingProfileId,
				trigger,
				team,
			});

			await updateContentStatus(
				repositoryIndex.dbId,
				contentStatus.embeddingProfileId,
				contentStatus.contentType,
				{
					...completedStatus(metadata),
				},
			);
		} catch (error) {
			console.error(
				`Failed to ingest ${contentStatus.contentType} for GitHub Repository: teamDbId=${teamDbId}, repository=${owner}/${repo}, embeddingProfileId=${contentStatus.embeddingProfileId}`,
				error,
			);

			const errorInfo = extractErrorInfo(error);

			captureException(error, {
				extra: {
					owner,
					repo,
					teamDbId,
					contentType: contentStatus.contentType,
					embeddingProfileId: contentStatus.embeddingProfileId,
					...errorInfo,
					errorContext:
						error instanceof DocumentLoaderError ? error.context : undefined,
				},
			});

			await updateContentStatus(
				repositoryIndex.dbId,
				contentStatus.embeddingProfileId,
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

async function getLastIngestedPrNumber(
	repositoryIndexDbId: number,
	embeddingProfileId: EmbeddingProfileId,
) {
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
				eq(
					githubRepositoryPullRequestEmbeddings.embeddingProfileId,
					embeddingProfileId,
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
	embeddingProfileId: EmbeddingProfileId,
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
				eq(
					githubRepositoryContentStatus.embeddingProfileId,
					embeddingProfileId,
				),
				eq(githubRepositoryContentStatus.contentType, contentType),
			),
		);
}
