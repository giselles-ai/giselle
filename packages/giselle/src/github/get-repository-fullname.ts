import { getRepositoryFullname } from "@giselles-ai/github-tool";
import type { GiselleContext } from "../types";

export async function getGitHubRepositoryFullname(args: {
	context: GiselleContext;
	repositoryNodeId: string;
	installationId: number;
}) {
	const authConfig = args.context.integrationConfigs?.github?.authV2;
	if (authConfig === undefined) {
		throw new Error("GitHub authV2 configuration is missing");
	}
	try {
		const result = await getRepositoryFullname(args.repositoryNodeId, {
			strategy: "app-installation",
			appId: authConfig.appId,
			privateKey: authConfig.privateKey,
			installationId: args.installationId,
		});
		if (result.data === undefined || result.error !== undefined) {
			const errorMessage = result.error?.message ?? "Unknown error";
			throw new Error(
				`Failed to get repository fullname for installation ${args.installationId}: ${errorMessage}`,
			);
		}
		if (result.data.node?.__typename !== "Repository") {
			throw new Error(
				`Expected Repository, got ${result.data.node?.__typename}`,
			);
		}
		return {
			owner: result.data.node.owner.login,
			repo: result.data.node.name,
		};
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error(
			`Failed to get repository fullname for installation ${args.installationId}: ${String(error)}`,
		);
	}
}
