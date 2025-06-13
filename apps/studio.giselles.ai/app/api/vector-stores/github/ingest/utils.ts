import { db, githubRepositoryIndex } from "@/drizzle";
import { octokit } from "@giselle-sdk/github-tool";
import { and, eq } from "drizzle-orm";
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
	const records = await db
		.select({
			owner: githubRepositoryIndex.owner,
			repo: githubRepositoryIndex.repo,
			installationId: githubRepositoryIndex.installationId,
			lastIngestedCommitSha: githubRepositoryIndex.lastIngestedCommitSha,
			teamDbId: githubRepositoryIndex.teamDbId,
		})
		.from(githubRepositoryIndex)
		.where(eq(githubRepositoryIndex.status, "idle"));

	return records.map((record) => ({
		owner: record.owner,
		repo: record.repo,
		installationId: record.installationId,
		lastIngestedCommitSha: record.lastIngestedCommitSha,
		teamDbId: record.teamDbId,
	}));
}

/**
 * Update the ingestion status of a repository
 */
export async function updateRepositoryStatus(
	owner: string,
	repo: string,
	status: "idle" | "running" | "failed" | "completed",
	commitSha?: string,
): Promise<void> {
	await db
		.update(githubRepositoryIndex)
		.set({
			status,
			lastIngestedCommitSha: commitSha || null,
		})
		.where(
			and(
				eq(githubRepositoryIndex.owner, owner),
				eq(githubRepositoryIndex.repo, repo),
			),
		);
}
