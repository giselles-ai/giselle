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
		// Re-throw if it's already a properly formatted error
		if (error instanceof Error) {
			// Check if error message indicates installation not found
			if (
				error.message.includes("installation not found") ||
				error.message.includes("installation may have been removed")
			) {
				throw error;
			}
			// Check if original error message indicates 404
			const errorMessage = error.message;
			if (errorMessage.includes("Not Found") || errorMessage.includes("404")) {
				throw new Error(
					`GitHub App installation not found (ID: ${args.installationId}). The installation may have been removed or the app may not have access to it.`,
				);
			}
			throw error;
		}
		throw new Error(
			`Failed to get repository fullname for installation ${args.installationId}: ${String(error)}`,
		);
	}
}
