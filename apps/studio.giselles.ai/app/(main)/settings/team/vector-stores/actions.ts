"use server";

import { db, githubRepositoryIndex } from "@/drizzle";
import type { GitHubRepositoryIndexId } from "@/packages/types";
import { getGitHubIdentityState } from "@/services/accounts";
import { buildAppInstallationClient } from "@/services/external/github";
import { fetchCurrentTeam } from "@/services/teams";
import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function registerRepositoryIndex(
	owner: string,
	repo: string,
	installationId: number,
) {
	const team = await fetchCurrentTeam();

	// check if the user have access to the installation
	// FIXME: When the installation is managed by the team, we should use the team's installation instead
	const githubIdentityState = await getGitHubIdentityState();
	if (githubIdentityState.status !== "authorized") {
		throw new Error("User is not authorized to access the repository");
	}
	const userClient = githubIdentityState.gitHubUserClient;
	const installationData = await userClient.getInstallations();
	const installation = installationData.installations.find(
		(installation) => installation.id === installationId,
	);
	if (!installation) {
		throw new Error("Installation not found");
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
		throw new Error("Repository not found");
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
