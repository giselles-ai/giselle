"use server";

import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, githubRepositoryIndex } from "@/drizzle";
import type { GitHubRepositoryIndexId } from "@/packages/types";
import { getGitHubIdentityState } from "@/services/accounts";
import { buildAppInstallationClient } from "@/services/external/github";
import { fetchCurrentTeam } from "@/services/teams";

import type { ActionResult } from "./types";

export async function registerRepositoryIndex(
	owner: string,
	repo: string,
	installationId: number,
): Promise<ActionResult> {
	try {
		const team = await fetchCurrentTeam();

		// check if the user have access to the installation
		// FIXME: When the installation is managed by the team, we should use the team's installation instead
		const githubIdentityState = await getGitHubIdentityState();
		if (githubIdentityState.status !== "authorized") {
			return {
				success: false,
				error: "GitHub account authentication is required",
			};
		}
		const userClient = githubIdentityState.gitHubUserClient;
		const installationData = await userClient.getInstallations();
		const installation = installationData.installations.find(
			(installation) => installation.id === installationId,
		);
		if (!installation) {
			return { success: false, error: "Installation not found" };
		}

		// check if the installation can access the repository
		const installationClient = await buildAppInstallationClient(installationId);

		// check if the repository is already registered
		const repository = await installationClient.request(
			"GET /repos/{owner}/{repo}",
			{
				owner,
				repo,
			},
		);
		if (repository.status !== 200) {
			return { success: false, error: "Repository not found" };
		}

		// Check if the repository is already registered for this team
		const existingIndex = await db
			.select()
			.from(githubRepositoryIndex)
			.where(
				and(
					eq(githubRepositoryIndex.owner, owner),
					eq(githubRepositoryIndex.repo, repo),
					eq(githubRepositoryIndex.teamDbId, team.dbId),
				),
			)
			.limit(1);

		if (existingIndex.length > 0) {
			return {
				success: false,
				error: `Repository ${owner}/${repo} is already registered for this team`,
			};
		}

		const newIndexId = `gthbi_${createId()}` as GitHubRepositoryIndexId;
		await db.insert(githubRepositoryIndex).values({
			id: newIndexId,
			owner,
			repo,
			teamDbId: team.dbId,
			installationId,
		});

		revalidatePath("/settings/team/vector-stores");
		return { success: true };
	} catch (error) {
		console.error("Error registering repository index:", error);
		return {
			success: false,
			error: "An error occurred while registering the repository",
		};
	}
}

export async function deleteRepositoryIndex(indexId: GitHubRepositoryIndexId) {
	const team = await fetchCurrentTeam();
	await db
		.delete(githubRepositoryIndex)
		.where(
			and(
				eq(githubRepositoryIndex.teamDbId, team.dbId),
				eq(githubRepositoryIndex.id, indexId),
			),
		);
	revalidatePath("/settings/team/vector-stores");
}
