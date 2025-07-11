"use server";

import type {
	GitHubIntegrationErrorState,
	GitHubIntegrationInstalledState,
	GitHubIntegrationInvalidCredentialState,
	GitHubIntegrationNotInstalledState,
	GitHubIntegrationUnauthorizedState,
} from "@giselle-sdk/giselle-engine";
import { db, type githubIntegrationSettings } from "@/drizzle";
import { getGitHubIdentityState } from "@/services/accounts";
import { gitHubAppInstallURL } from "@/services/external/github";

export async function getGitHubIntegrationState(
	agentDbId: number,
): Promise<GitHubIntegrationState> {
	const identityState = await getGitHubIdentityState();
	if (identityState.status === "unauthorized") {
		return {
			status: identityState.status,
			authUrl: "/auth/connect/github",
		};
	}
	if (identityState.status === "invalid-credential") {
		return {
			status: identityState.status,
		};
	}
	if (identityState.status === "error") {
		return {
			status: "error",
			errorMessage: identityState.errorMessage,
		};
	}

	const gitHubUserClient = identityState.gitHubUserClient;
	const [{ installations }, installationUrl] = await Promise.all([
		gitHubUserClient.getInstallations(),
		gitHubAppInstallURL(),
	]);
	if (installationUrl == null) {
		return {
			status: "error",
			errorMessage: "Failed to get GitHub App installation URL.",
		};
	}
	if (installations.length === 0) {
		return {
			status: "not-installed",
			installationUrl,
		};
	}

	const [installationsWithRepositories, githubIntegrationSetting] =
		await Promise.all([
			Promise.all(
				installations.map(async (installation) => {
					const data = await gitHubUserClient.getRepositories(installation.id);
					return {
						...installation,
						repositories: data.repositories,
					};
				}),
			),
			db.query.githubIntegrationSettings.findFirst({
				where: (githubIntegrationSettings, { eq }) =>
					eq(githubIntegrationSettings.agentDbId, agentDbId),
			}),
		]);

	const allRepositories = installationsWithRepositories
		.flatMap(
			(installationWithRepositories) =>
				installationWithRepositories.repositories,
		)
		.sort((a, b) => a.name.localeCompare(b.name));

	return {
		status: "installed",
		repositories: allRepositories,
		installations: installationsWithRepositories,
		setting: githubIntegrationSetting,
		installationUrl,
	};
}

type GitHubIntegrationState = (
	| GitHubIntegrationUnauthorizedState
	| GitHubIntegrationInvalidCredentialState
	| GitHubIntegrationNotInstalledState
	| GitHubIntegrationInstalledState
	| GitHubIntegrationErrorState
) &
	GitHubIntegrationSettingState;

type GitHubIntegrationSettingState = {
	setting?: GitHubIntegrationSetting;
};

type GitHubIntegrationSetting = Omit<
	typeof githubIntegrationSettings.$inferSelect,
	"dbId" | "agentDbId"
>;
