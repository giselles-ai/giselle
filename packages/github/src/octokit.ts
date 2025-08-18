import { createAppAuth, createOAuthUserAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";
import type { GitHubAuthConfig } from "./types";

export function octokit(authConfig: GitHubAuthConfig) {
	switch (authConfig.strategy) {
		case "app-installation": {
			return new Octokit({
				authStrategy: createAppAuth,
				auth: {
					appId: authConfig.appId,
					privateKey: authConfig.privateKey,
					installationId: authConfig.installationId,
				},
			});
		}
		case "app": {
			return new Octokit({
				authStrategy: createOAuthUserAuth,
				auth: {
					appId: authConfig.appId,
					privateKey: authConfig.privateKey,
				},
			});
		}
		case "personal-access-token": {
			return new Octokit({ auth: authConfig.personalAccessToken });
		}
		default: {
			const _exhaustiveCheck: never = authConfig;
			throw new Error(`Unhandled authConfig strategy: ${_exhaustiveCheck}`);
		}
	}
}
