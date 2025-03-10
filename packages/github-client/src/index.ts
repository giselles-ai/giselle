import { createAppAuth, createOAuthUserAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";
import { Client, cacheExchange, fetchExchange } from "urql";
import { graphql as gql } from "./graphql";
import type { GitHubAuthConfig } from "./types";
export * from "./types";

export const IssueNodeIdQuery = gql(/* GraphQL */ `
  query IssueNodeIdQuery($name: String!, $owner: String!, $issueNumber: Int!) {
    repository(name: $name, owner: $owner) {
        issue(number: $issueNumber) {
            id
            title
        }
    }
  }
`);

export const IssueCommentNodeIdQuery = gql(/* GraphQL */ `
  query IssueCommentNodeIdQuery($name: String!, $owner: String!, $issueNumber: Int!) {
    repository(name: $name, owner: $owner) {
        issue(number: $issueNumber) {
            id
            title
            comments(first: 100) {
                nodes {
                    id
                }
            }
        }
    }
  }
`);

export async function graphql(authConfig: GitHubAuthConfig) {
	let token = "";
	switch (authConfig.strategy) {
		case "github-installation": {
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
		case "github-app-user":
		case "github-token": {
			token = authConfig.token;
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

export function octokit(authConfig: GitHubAuthConfig) {
	switch (authConfig.strategy) {
		case "github-installation": {
			return new Octokit({
				authStrategy: createAppAuth,
				auth: {
					appId: authConfig.appId,
					privateKey: authConfig.privateKey,
					installationId: authConfig.installationId,
				},
			});
		}
		case "github-token": {
			return new Octokit({ auth: authConfig.token });
		}
		case "github-app-user": {
			return new Octokit({
				authStrategy: createOAuthUserAuth,
				auth: {
					clientId: authConfig.clientId,
					clientSecret: authConfig.clientSecret,
					clientType: "oauth-app",
					token: authConfig.token,
					refreshToken: authConfig.refreshToken,
				},
			});
		}
		default: {
			const _exhaustiveCheck: never = authConfig;
			throw new Error(`Unhandled authConfig strategy: ${_exhaustiveCheck}`);
		}
	}
}
