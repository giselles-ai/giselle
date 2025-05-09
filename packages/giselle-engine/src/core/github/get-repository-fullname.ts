import { getRepositoryFullname } from "@giselle-sdk/github-tool";
import type { GiselleEngineContext } from "../types";

export async function getGitHubRepositoryFullname(args: {
	context: GiselleEngineContext;
	repositoryNodeId: string;
	installationId: number;
}) {
	const authConfig = args.context.integrationConfigs?.github?.authV2;
	if (authConfig === undefined) {
		throw new Error("GitHub authV2 configuration is missing");
	}
	const result = await getRepositoryFullname(args.repositoryNodeId, {
		strategy: "app-installation",
		appId: authConfig.appId,
		privateKey: authConfig.privateKey,
		installationId: args.installationId,
	});
	if (result.data === undefined || result.error !== undefined) {
		throw new Error(
			`Failed to get repository fullname: ${result.error?.message}`,
		);
	}
	if (result.data.node?.__typename !== "Repository") {
		throw new Error(`Expected Repository, got ${result.data.node?.__typename}`);
	}
	return { owner: result.data.node.owner.login, repo: result.data.node.name };
}
