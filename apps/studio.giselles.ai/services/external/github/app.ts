import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";

/**
 * Generates the GitHub App installation URL.
 *
 * This function authenticates as a GitHub App, retrieves the app information,
 * and constructs the URL for installing the app on a GitHub account.
 *
 * @returns {Promise<string>} The URL for installing the GitHub App.
 * @throws {Error} If the request to get app information fails.
 */
export async function gitHubAppInstallURL(): Promise<string | undefined> {
	const auth = appAuth();
	const app = await auth({ type: "app" });
	const octokit = new Octokit({ auth: app.token });
	try {
		const res = await octokit.request("GET /app");
		if (res.status !== 200 || !res.data) {
			throw new Error("Failed to get app information");
		}
		return `https://github.com/apps/${res.data.slug}/installations/new`;
	} catch (error: unknown) {
		console.error("Error getting GitHub App information:", error);
		return;
	}
}

/**
 * Builds an authenticated GitHub client for a specific app installation.
 *
 * Authenticating as a GitHub App installation: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation
 *
 * @param installationId - The ID of the GitHub app installation.
 * @returns A promise that resolves to an authenticated Octokit instance.
 */
export async function buildAppInstallationClient(installationId: number) {
	const auth = appAuth();
	const installationAuth = await auth({
		type: "installation",
		installationId,
	});

	return new Octokit({
		auth: installationAuth.token,
	});
}

function appAuth() {
	const appId = process.env.GITHUB_APP_ID;
	if (!appId) {
		throw new Error("GITHUB_APP_ID is empty");
	}
	const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
	if (!privateKey) {
		throw new Error("GITHUB_APP_PRIVATE_KEY is empty");
	}
	const clientId = process.env.GITHUB_APP_CLIENT_ID;
	if (!clientId) {
		throw new Error("GITHUB_APP_CLIENT_ID is empty");
	}
	const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
	if (!clientSecret) {
		throw new Error("GITHUB_APP_CLIENT_SECRET is empty");
	}

	const auth = createAppAuth({
		appId,
		privateKey,
		clientId,
		clientSecret,
	});
	return auth;
}
