import type { components } from "@octokit/openapi-types";
import { desc, eq } from "drizzle-orm";
import {
	db,
	githubRepositoryContentStatus,
	githubRepositoryIndex,
} from "@/drizzle";
import { safeParseContentStatusMetadata } from "@/lib/vector-stores/github/ingest/content-metadata-schema";
import { getGitHubIdentityState } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import type {
	InstallationWithRepos,
	RepositoryIndexWithContentStatus,
	RepositoryWithContentStatuses,
} from "./types";

export async function getGitHubRepositoryIndexes(): Promise<
	RepositoryWithContentStatuses[]
> {
	const team = await fetchCurrentTeam();

	const records = await db
		.select({
			repository: githubRepositoryIndex,
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
		.where(eq(githubRepositoryIndex.teamDbId, team.dbId))
		.orderBy(desc(githubRepositoryIndex.dbId));

	// Group by repository
	const repositoryMap = new Map<number, RepositoryWithContentStatuses>();

	for (const record of records) {
		const { repository, contentStatus } = record;

		if (!repositoryMap.has(repository.dbId)) {
			repositoryMap.set(repository.dbId, {
				...repository,
				contentStatuses: [],
			});
		}

		if (contentStatus) {
			const repo = repositoryMap.get(repository.dbId);
			if (repo) {
				repo.contentStatuses.push(contentStatus);
			}
		}
	}

	return Array.from(repositoryMap.values());
}

export async function getRepositoryIndexesWithContentStatus(): Promise<
	RepositoryIndexWithContentStatus[]
> {
	const repositories = await getGitHubRepositoryIndexes();

	return repositories.map((repository) => {
		const blobStatus = repository.contentStatuses.find(
			(cs) => cs.contentType === "blob",
		);

		if (!blobStatus) {
			throw new Error(
				`Repository ${repository.dbId} missing blob content status`,
			);
		}

		const parseResult = safeParseContentStatusMetadata(
			blobStatus.metadata,
			"blob",
		);
		const parsedMetadata =
			parseResult.success && parseResult.data?.contentType === "blob"
				? parseResult.data
				: null;

		return {
			id: repository.id,
			dbId: repository.dbId,
			owner: repository.owner,
			repo: repository.repo,
			teamDbId: repository.teamDbId,
			installationId: repository.installationId,
			createdAt: repository.createdAt,
			updatedAt: repository.updatedAt,
			blobStatus: {
				contentType: blobStatus.contentType,
				enabled: blobStatus.enabled,
				status: blobStatus.status,
				lastSyncedAt: blobStatus.lastSyncedAt,
				metadata: parsedMetadata,
				errorCode: blobStatus.errorCode,
				retryAfter: blobStatus.retryAfter,
				updatedAt: blobStatus.updatedAt,
			},
		};
	});
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
