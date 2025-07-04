import { fetchDefaultBranchHead } from "@giselle-sdk/github-tool";
import { DocumentLoaderError, RagError } from "@giselle-sdk/rag";
import { captureException } from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { ingestGitHubBlobs } from "../ingest-github-repository";
import type { TargetGitHubRepository } from "../types";
import {
	buildOctokit,
	fetchTargetGitHubRepositories,
	updateRepositoryStatusToCompleted,
	updateRepositoryStatusToFailed,
	updateRepositoryStatusToRunning,
} from "../utils";

export const maxDuration = 800;

export async function GET(_request: NextRequest) {
	// Only allow in development environment
	if (process.env.NODE_ENV !== "development") {
		return new Response("Not available in production", {
			status: 403,
		});
	}

	// Check required environment variables
	const requiredEnvVars = ["GITHUB_APP_ID", "GITHUB_APP_PRIVATE_KEY"];

	const missingEnvVars = requiredEnvVars.filter(
		(envVar) => !process.env[envVar],
	);

	if (missingEnvVars.length > 0) {
		return new Response(
			JSON.stringify({
				error: "Missing required environment variables",
				missingVars: missingEnvVars,
				message:
					"Please set the following environment variables in .env.local: " +
					missingEnvVars.join(", "),
			}),
			{
				status: 400,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}

	const targetGitHubRepositories = await fetchTargetGitHubRepositories();

	console.log(
		`Found ${targetGitHubRepositories.length} target repositories to process`,
	);

	if (targetGitHubRepositories.length === 0) {
		return new Response("No repositories to process", { status: 200 });
	}

	const results = await Promise.allSettled(
		targetGitHubRepositories.map(processRepository),
	);

	const successful = results.filter(
		(result) => result.status === "fulfilled",
	).length;
	const failed = results.filter(
		(result) => result.status === "rejected",
	).length;

	return new Response(
		JSON.stringify({
			message: "Processing completed",
			total: targetGitHubRepositories.length,
			successful,
			failed,
			repositories: targetGitHubRepositories.map((repo) => ({
				owner: repo.owner,
				repo: repo.repo,
				status: repo.status,
			})),
		}),
		{
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
}

async function processRepository(
	targetGitHubRepository: TargetGitHubRepository,
) {
	const { owner, repo, installationId, teamDbId, dbId } =
		targetGitHubRepository;

	console.log(`Processing repository: ${owner}/${repo}`);

	try {
		await updateRepositoryStatusToRunning(dbId);

		const octokitClient = buildOctokit(installationId);
		const commit = await fetchDefaultBranchHead(octokitClient, owner, repo);
		const source = {
			owner,
			repo,
			commitSha: commit.sha,
		};

		await ingestGitHubBlobs({
			octokitClient,
			source,
			teamDbId,
		});

		await updateRepositoryStatusToCompleted(dbId, commit.sha);
		console.log(`Successfully processed repository: ${owner}/${repo}`);
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
