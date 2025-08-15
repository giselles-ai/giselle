import type { components } from "@octokit/openapi-types";
import { desc, eq } from "drizzle-orm";
import {
	db,
	githubRepositoryContentStatus,
	githubRepositoryEmbeddingProfiles,
	githubRepositoryIndex,
} from "@/drizzle";
import type { RepositoryWithStatuses } from "@/lib/vector-stores/github";
import { getGitHubIdentityState } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import type { InstallationWithRepos } from "./types";

export async function getGitHubRepositoryIndexes(): Promise<
	RepositoryWithStatuses[]
> {
	const team = await fetchCurrentTeam();

	const records = await db
		.select({
			repositoryIndex: githubRepositoryIndex,
			contentStatus: githubRepositoryContentStatus,
			embeddingProfile: githubRepositoryEmbeddingProfiles,
		})
		.from(githubRepositoryIndex)
		.leftJoin(
			githubRepositoryContentStatus,
			eq(
				githubRepositoryContentStatus.repositoryIndexDbId,
				githubRepositoryIndex.dbId,
			),
		)
		.leftJoin(
			githubRepositoryEmbeddingProfiles,
			eq(
				githubRepositoryEmbeddingProfiles.repositoryIndexDbId,
				githubRepositoryIndex.dbId,
			),
		)
		.where(eq(githubRepositoryIndex.teamDbId, team.dbId))
		.orderBy(desc(githubRepositoryIndex.dbId));

	// Group by repository
	const repositoryMap = new Map<
		number,
		RepositoryWithStatuses & { embeddingProfileIds: number[] }
	>();

	for (const record of records) {
		const { repositoryIndex, contentStatus, embeddingProfile } = record;

		if (!repositoryMap.has(repositoryIndex.dbId)) {
			repositoryMap.set(repositoryIndex.dbId, {
				repositoryIndex,
				contentStatuses: [],
				embeddingProfileIds: [],
			});
		}

		const repo = repositoryMap.get(repositoryIndex.dbId);
		if (repo) {
			if (contentStatus) {
				// Check if this content status was already added
				const exists = repo.contentStatuses.some(
					(cs) =>
						cs.repositoryIndexDbId === contentStatus.repositoryIndexDbId &&
						cs.contentType === contentStatus.contentType,
				);
				if (!exists) {
					repo.contentStatuses.push(contentStatus);
				}
			}

			if (embeddingProfile) {
				// Add unique embedding profile IDs
				if (
					!repo.embeddingProfileIds.includes(
						embeddingProfile.embeddingProfileId,
					)
				) {
					repo.embeddingProfileIds.push(embeddingProfile.embeddingProfileId);
				}
			}
		}
	}

	return Array.from(repositoryMap.values());
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
