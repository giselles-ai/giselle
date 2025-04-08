import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";
import type { GitHubInstallationAppAuth } from "./types";

/**
 * Repository information from GitHub
 */
export interface Repository {
	id: number;
	node_id: string;
	name: string;
	full_name: string;
	html_url: string;
	private: boolean;
	description: string | null;
}

/**
 * Installation information with associated repositories
 */
export interface InstallationWithRepositories {
	id: number;
	account: {
		login?: string;
		name?: string;
		avatar_url?: string;
	};
	app_id: number;
	target_id: number;
	target_type: string;
	repositories: Repository[];
}

export async function getInstallation(auth: GitHubInstallationAppAuth) {
	const client = new Octokit({
		authStrategy: createAppAuth,
		auth: {
			appId: auth.appId,
			privateKey: auth.privateKey,
			installationId: auth.installationId,
		},
	});

	// Get installation details
	const installationRes = await client.request(
		"GET /app/installations/{installation_id}",
		{
			installation_id: auth.installationId,
		},
	);

	// Get repositories for this installation
	const reposRes = await client.request("GET /installation/repositories", {
		per_page: 100,
	});

	/** @todo elminates type assertion */
	return {
		...installationRes.data,
		repositories: reposRes.data.repositories,
	} as InstallationWithRepositories;
}
