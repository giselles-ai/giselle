import { createAppAuth } from "@octokit/auth-app";
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
			const installationAcessTokenAuthentication = await auth({
				type: "installation",
				installationId: authConfig.installationId,
			});
			token = installationAcessTokenAuthentication.token;
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
