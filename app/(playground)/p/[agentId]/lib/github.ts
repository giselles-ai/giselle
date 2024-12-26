"use server";

import { getOauthCredential } from "@/app/(auth)/lib";
import { db, type githubIntegrationSettings } from "@/drizzle";
import {
	buildGitHubUserClient,
	needsAuthorization,
} from "@/services/external/github";
import type { GitHubIntegrationState } from "../contexts/github-integration";

export async function getGitHubIntegrationState(
	agentDbId: number,
): Promise<
	Omit<GitHubIntegrationState, "upsertGitHubIntegrationSettingAction">
> {
	const credential = await getOauthCredential("github");
	if (!credential) {
		return {
			needsAuthorization: true,
			repositories: [],
			setting: undefined,
		};
	}

	try {
		const gitHubClient = buildGitHubUserClient(credential);
		const { installations } = await gitHubClient.getInstallations();
		const [repositories, githubIntegrationSetting] = await Promise.all([
			Promise.all(
				installations.map(async (installation) => {
					const { repositories: repos } = await gitHubClient.getRepositories(
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
			needsAuthorization: false,
			repositories,
			setting: githubIntegrationSetting,
		};
	} catch (error) {
		if (needsAuthorization(error)) {
			return {
				needsAuthorization: true,
				repositories: [],
				setting: undefined,
			};
		}
		throw error;
	}
}

export type GitHubIntegrationSetting = Omit<
	typeof githubIntegrationSettings.$inferSelect,
	"dbId" | "agentDbId"
>;

interface CreateGitHubIntegrationSettingSuccess {
	result: "success";
	setting: GitHubIntegrationSetting;
}
interface CreateGitHubIntegrationSettingError {
	result: "error";
	message: string;
}
export type CreateGitHubIntegrationSettingResult =
	| CreateGitHubIntegrationSettingSuccess
	| CreateGitHubIntegrationSettingError;
