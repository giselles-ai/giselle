import { octokit } from "@giselle-sdk/github-tool";
import { and, eq, isNotNull, lt, or } from "drizzle-orm";
import { db, githubRepositoryIndex } from "@/drizzle";
import type { TargetGitHubRepository } from "./types";

export function buildOctokit(installationId: number) {
	const appId = process.env.GITHUB_APP_ID;
	if (!appId) {
		throw new Error("GITHUB_APP_ID is empty");
	}
	const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
	if (!privateKey) {
		throw new Error("GITHUB_APP_PRIVATE_KEY is empty");
	}

	return octokit({
		strategy: "app-installation",
		appId,
		privateKey,
		installationId,
	});
}

/**
 * Fetch target GitHub repositories to ingest
 *
 * target repositories are:
 * - idle
 * - failed and retryAfter has passed
 * - running and updated more than 15 minutes ago (stale)
 * - completed and updated more than 24 hours ago (outdated)
 *
 * @returns Target GitHub repositories to ingest
 */
export async function fetchTargetGitHubRepositories(): Promise<
	TargetGitHubRepository[]
> {
	// To prevent the race condition, consider running status as stale if it hasn't been updated for 15 minutes (> 800 seconds)
	const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);
	// To update repository which updated more than 24 hours ago
	const outdatedThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
	// Current time for retryAfter comparison
	const now = new Date();

	const records = await db
		.select({
			dbId: githubRepositoryIndex.dbId,
			owner: githubRepositoryIndex.owner,
			repo: githubRepositoryIndex.repo,
			installationId: githubRepositoryIndex.installationId,
			lastIngestedCommitSha: githubRepositoryIndex.lastIngestedCommitSha,
			teamDbId: githubRepositoryIndex.teamDbId,
			status: githubRepositoryIndex.status,
		})
		.from(githubRepositoryIndex)
		.where(
			or(
				eq(githubRepositoryIndex.status, "idle"),
				and(
					eq(githubRepositoryIndex.status, "failed"),
					isNotNull(githubRepositoryIndex.retryAfter),
					lt(githubRepositoryIndex.retryAfter, now),
				),
				and(
					eq(githubRepositoryIndex.status, "running"),
					lt(githubRepositoryIndex.updatedAt, staleThreshold),
				),
				and(
					eq(githubRepositoryIndex.status, "completed"),
					lt(githubRepositoryIndex.updatedAt, outdatedThreshold),
				),
			),
		);

	return records.map((record) => ({
		dbId: record.dbId,
		owner: record.owner,
		repo: record.repo,
		installationId: record.installationId,
		lastIngestedCommitSha: record.lastIngestedCommitSha,
		teamDbId: record.teamDbId,
		status: record.status,
	}));
}

export async function updateRepositoryStatusToRunning(dbId: number) {
	await db
		.update(githubRepositoryIndex)
		.set({
			status: "running",
		})
		.where(eq(githubRepositoryIndex.dbId, dbId));
}

export async function updateRepositoryStatusToCompleted(
	dbId: number,
	commitSha: string,
) {
	await db
		.update(githubRepositoryIndex)
		.set({
			status: "completed",
			lastIngestedCommitSha: commitSha,
			// clear error info
			errorCode: null,
			retryAfter: null,
		})
		.where(eq(githubRepositoryIndex.dbId, dbId));
}

export async function updateRepositoryStatusToFailed(
	dbId: number,
	errorInfo: {
		errorCode: string;
		retryAfter: Date | null;
	},
) {
	await db
		.update(githubRepositoryIndex)
		.set({
			status: "failed",
			errorCode: errorInfo.errorCode,
			retryAfter: errorInfo.retryAfter,
		})
		.where(eq(githubRepositoryIndex.dbId, dbId));
}
