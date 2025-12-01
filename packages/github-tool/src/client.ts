import { createAppAuth } from "@octokit/auth-app";
import { RequestError } from "@octokit/request-error";
import { Client, cacheExchange, fetchExchange } from "urql";
import type { GitHubAuthConfig } from "./types";

export async function graphql(authConfig: GitHubAuthConfig) {
	let token = "";
	switch (authConfig.strategy) {
		case "app-installation": {
			const auth = createAppAuth({
				appId: authConfig.appId,
				privateKey: authConfig.privateKey,
				installationId: authConfig.installationId,
			});
			try {
				const installationAcessTokenAuthentication = await auth({
					type: "installation",
					installationId: authConfig.installationId,
				});
				token = installationAcessTokenAuthentication.token;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				// Check if it's a 404 Not Found error (installation doesn't exist)
				// @octokit/auth-app may throw HttpError or RequestError
				const statusCode =
					error instanceof RequestError
						? error.status
						: typeof error === "object" &&
								error !== null &&
								"status" in error &&
								typeof error.status === "number"
							? error.status
							: null;
				const isNotFound =
					statusCode === 404 ||
					errorMessage.includes("Not Found") ||
					errorMessage.includes("404");
				if (isNotFound) {
					throw new Error(
						`GitHub App installation not found (ID: ${authConfig.installationId}). The installation may have been removed or the app may not have access to it.`,
					);
				}
				throw new Error(
					`Failed to authenticate GitHub App installation (ID: ${authConfig.installationId}): ${errorMessage}. The installation may have been removed or the app may not have access to it.`,
				);
			}
			break;
		}
		case "app": {
			const auth = createAppAuth({
				appId: authConfig.appId,
				privateKey: authConfig.privateKey,
			});
			const appAuthentication = await auth({
				type: "app",
			});
			token = appAuthentication.token;
			break;
		}
		case "personal-access-token": {
			token = authConfig.personalAccessToken;
			break;
		}
		default: {
			const _exhaustiveCheck: never = authConfig;
			throw new Error(`Unhandled authConfig strategy: ${_exhaustiveCheck}`);
		}
	}
	/**
	 * @todo Use auth exchange to update oauth token
	 */
	return new Client({
		url: "https://api.github.com/graphql",
		exchanges: [cacheExchange, fetchExchange],
		fetchOptions: {
			headers: { authorization: `Bearer ${token}` },
		},
	});
}
