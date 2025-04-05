"use server";

import { db, type githubIntegrationSettings } from "@/drizzle";
import { getGitHubIdentityState } from "@/services/accounts";
import type { GitHubIntegrationState } from "@giselle-sdk/integration";
import type { components } from "@octokit/openapi-types";

const settingPageUrl = "/settings/team/integrations";

export async function getGitHubIntegrationState(
	agentDbId: number,
): Promise<GitHubIntegrationState> {
	const identityState = await getGitHubIdentityState();
	if (identityState.status === "unauthorized") {
		return {
			status: identityState.status,
			settingPageUrl,
		};
	}
	if (identityState.status === "invalid-credential") {
		return {
			status: identityState.status,
			settingPageUrl,
		};
	}

	const gitHubUserClient = identityState.gitHubUserClient;
	const { installations } = await gitHubUserClient.getInstallations();
	if (installations.length === 0) {
		return {
			status: "not-installed",
			settingPageUrl,
		};
	}

	const [repositories, githubIntegrationSetting] = await Promise.all([
		Promise.all(
			installations.map(async (installation) => {
				const { repositories: repos } = await gitHubUserClient.getRepositories(
					installation.id,
				);
				return repos;
			}),
		).then((repos) =>
			repos.flat().sort((a, b) => a.name.localeCompare(b.name)),
		),
		db.query.githubIntegrationSettings.findFirst({
			where: (githubIntegrationSettings, { eq }) =>
				eq(githubIntegrationSettings.agentDbId, agentDbId),
		}),
	]);
	return {
		status: "installed",
		repositories,
	};
}
