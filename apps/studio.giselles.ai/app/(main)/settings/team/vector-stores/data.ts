import type { components } from "@octokit/openapi-types";
import type { SQL } from "drizzle-orm";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, githubRepositoryContentStatus, githubRepositoryIndex } from "@/db";
import type { RepositoryWithStatuses } from "@/lib/vector-stores/github";
import { officialVectorStoreConfig } from "@/lib/vector-stores/official-config";

export type { DocumentVectorStoreWithProfiles } from "@/lib/vector-stores/document/queries";
export {
	getDocumentVectorStores,
	getOfficialDocumentVectorStores,
} from "@/lib/vector-stores/document/queries";

import { getGitHubIdentityState } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import type { InstallationWithRepos } from "./types";

/**
 * Internal function to fetch repository indexes by team DB ID with optional additional conditions
 */
async function fetchRepositoryIndexes(
	teamDbId: number,
	additionalCondition?: SQL,
): Promise<RepositoryWithStatuses[]> {
	const whereCondition = additionalCondition
		? and(eq(githubRepositoryIndex.teamDbId, teamDbId), additionalCondition)
		: eq(githubRepositoryIndex.teamDbId, teamDbId);

	const records = await db
		.select({
			repositoryIndex: githubRepositoryIndex,
			contentStatus: githubRepositoryContentStatus,
		})
		.from(githubRepositoryIndex)
		.leftJoin(
			githubRepositoryContentStatus,
			eq(
				githubRepositoryContentStatus.repositoryIndexDbId,
				githubRepositoryIndex.dbId,
			),
		)
		.where(whereCondition)
		.orderBy(desc(githubRepositoryIndex.dbId));

	// Group by repository
	const repositoryMap = new Map<number, RepositoryWithStatuses>();

	for (const record of records) {
		const { repositoryIndex, contentStatus } = record;

		if (!repositoryMap.has(repositoryIndex.dbId)) {
			repositoryMap.set(repositoryIndex.dbId, {
				repositoryIndex,
				contentStatuses: [],
			});
		}

		if (contentStatus) {
			const repo = repositoryMap.get(repositoryIndex.dbId);
			if (repo) {
				repo.contentStatuses.push(contentStatus);
			}
		}
	}

	return Array.from(repositoryMap.values());
}

export async function getGitHubRepositoryIndexes(): Promise<
	RepositoryWithStatuses[]
> {
	const team = await fetchCurrentTeam();
	return fetchRepositoryIndexes(team.dbId);
}

/**
 * Get official GitHub Repository Indexes.
 * Returns empty array if official feature is disabled.
 */
export async function getOfficialGitHubRepositoryIndexes(): Promise<
	RepositoryWithStatuses[]
> {
	const { teamDbId, githubRepositoryIndexIds } = officialVectorStoreConfig;

	if (teamDbId === null || githubRepositoryIndexIds.length === 0) {
		return [];
	}

	return await fetchRepositoryIndexes(
		teamDbId,
		inArray(githubRepositoryIndex.id, githubRepositoryIndexIds),
	);
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
