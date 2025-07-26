import { type GitHubAuthConfig, octokit } from "@giselle-sdk/github-tool";

/**
 * Build GitHub App Octokit client with installation authentication
 */
export function buildOctokit(installationId: number) {
	const appId = process.env.GITHUB_APP_ID;
	if (!appId) {
		throw new Error("GITHUB_APP_ID is empty");
	}
	const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
	if (!privateKey) {
		throw new Error("GITHUB_APP_PRIVATE_KEY is empty");
	}

	return octokit({
		strategy: "app-installation",
		appId,
		privateKey,
		installationId,
	});
}

/**
 * Build GitHub auth config for loaders
 */
export function buildGitHubAuthConfig(
	installationId: number,
): GitHubAuthConfig {
	const appId = process.env.GITHUB_APP_ID;
	if (!appId) {
		throw new Error("GITHUB_APP_ID is empty");
	}
	const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
	if (!privateKey) {
		throw new Error("GITHUB_APP_PRIVATE_KEY is empty");
	}

	return {
		strategy: "app-installation",
		appId,
		privateKey,
		installationId,
	};
}
