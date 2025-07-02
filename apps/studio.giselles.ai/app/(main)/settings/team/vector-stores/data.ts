import type { components } from "@octokit/openapi-types";
import { desc, eq } from "drizzle-orm";
import { db, githubRepositoryIndex } from "@/drizzle";
import { getGitHubIdentityState } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import type { InstallationWithRepos } from "./types";

export async function getGitHubRepositoryIndexes() {
	const team = await fetchCurrentTeam();
	const records = await db
		.select()
		.from(githubRepositoryIndex)
		.where(eq(githubRepositoryIndex.teamDbId, team.dbId))
		.orderBy(desc(githubRepositoryIndex.dbId));
	return records;
}

export async function getInstallationsWithRepos(): Promise<
	InstallationWithRepos[]
> {
	const githubIdentityState = await getGitHubIdentityState();

	if (githubIdentityState.status !== "authorized") {
		throw new Error("GitHub authentication required");
	}

	const userClient = githubIdentityState.gitHubUserClient;
	const installationData = await userClient.getInstallations();
	const installations = installationData.installations;

	const installationsWithRepos = await Promise.all(
		installations.map(
			async (installation: components["schemas"]["installation"]) => {
				const repos = await userClient.getRepositories(installation.id);
				const installationId = installation.id;

				if (!installation.account) {
					throw new Error("Installation account is null");
				}

				const installationName =
					"login" in installation.account
						? installation.account.login
						: installation.account.name;

				return {
					installation: {
						id: installationId,
						name: installationName,
					},
					repositories: repos.repositories.map(
						(repo: components["schemas"]["repository"]) => ({
							id: repo.id,
							owner: repo.owner.login,
							name: repo.name,
						}),
					),
				};
			},
		),
	);

	return installationsWithRepos;
}
