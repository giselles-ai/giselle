import {
	type GitHubRepositoryIndexStatus,
	db,
	githubRepositoryIndex,
} from "@/drizzle";
import { octokit } from "@giselle-sdk/github-tool";
import { and, eq, lt, or } from "drizzle-orm";
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

export async function fetchTargetGitHubRepositories(): Promise<
	TargetGitHubRepository[]
> {
	// Consider running status as stale if it hasn't been updated for 15 minutes (> 800 seconds)
	const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);

	const records = await db
		.select({
			dbId: githubRepositoryIndex.dbId,
			owner: githubRepositoryIndex.owner,
			repo: githubRepositoryIndex.repo,
			installationId: githubRepositoryIndex.installationId,
			lastIngestedCommitSha: githubRepositoryIndex.lastIngestedCommitSha,
			currentIngestionCommitSha:
				githubRepositoryIndex.currentIngestionCommitSha,
			teamDbId: githubRepositoryIndex.teamDbId,
		})
		.from(githubRepositoryIndex)
		.where(
			or(
				eq(githubRepositoryIndex.status, "idle"),
				eq(githubRepositoryIndex.status, "failed"),
				and(
					eq(githubRepositoryIndex.status, "running"),
					lt(githubRepositoryIndex.updatedAt, staleThreshold),
				),
			),
		);

	return records.map((record) => ({
		dbId: record.dbId,
		owner: record.owner,
		repo: record.repo,
		installationId: record.installationId,
		lastIngestedCommitSha: record.lastIngestedCommitSha,
		currentIngestionCommitSha: record.currentIngestionCommitSha,
		teamDbId: record.teamDbId,
	}));
}

/**
 * Update the ingestion status of a repository
 */
export async function updateRepositoryStatus(
	dbId: number,
	status: Exclude<GitHubRepositoryIndexStatus, "idle">,
	commitSha: string,
): Promise<void> {
	const updates: Partial<typeof githubRepositoryIndex.$inferInsert> = {
		status,
	};

	if (status === "completed") {
		// Clear current ingestion and update last successful ingestion
		updates.currentIngestionCommitSha = null;
		updates.lastIngestedCommitSha = commitSha;
	} else {
		updates.currentIngestionCommitSha = commitSha;
	}

	await db
		.update(githubRepositoryIndex)
		.set(updates)
		.where(eq(githubRepositoryIndex.dbId, dbId));
}
