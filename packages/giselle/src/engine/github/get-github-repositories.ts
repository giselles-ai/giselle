import { octokit } from "@giselle-sdk/github";
import type { GiselleEngineContext } from "../types";

interface Repository {
	nodeId: string;
	fullName: string;
}
export async function getGitHubRepositories(args: {
	context: GiselleEngineContext;
}) {
	const githubConfig = args.context.integrationConfigs?.github;
	if (!githubConfig) {
		return [];
	}

	if (githubConfig.auth.strategy === "personal-access-token") {
		const result = await octokit({
			strategy: githubConfig.auth.strategy,
			personalAccessToken: githubConfig.auth.personalAccessToken,
		}).request("GET /user/repos");
		return result.data.map(
			(d) =>
				({
					nodeId: d.node_id,
					fullName: d.full_name,
				}) satisfies Repository,
		);
	}
	const githubAppId = githubConfig.auth.appId;
	const githubAppPrivateKey = githubConfig.auth.privateKey;

	const installationIds = await githubConfig.auth.resolver.installtionIds();

	const repos: Repository[] = [];
	await Promise.all(
		installationIds.map(async (installationId) => {
			const client = octokit({
				strategy: "app-installation",
				appId: githubAppId,
				privateKey: githubAppPrivateKey,
				installationId,
			});
			const result = await client.request("GET /installation/repositories");
			for (const repository of result.data.repositories) {
				repos.push({
					nodeId: repository.node_id,
					fullName: repository.full_name,
				});
			}
		}),
	);
	return repos;
}
