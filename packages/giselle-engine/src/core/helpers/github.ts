import { createAppAuth } from "@octokit/auth-app";

export async function githubAppAuth() {
	const auth = appAuth();
	return auth({
		type: "app",
	});
}

export async function githubAppInstallationAuth(installationId: number) {
	const auth = appAuth();
	return auth({
		type: "installation",
		installationId,
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

	return createAppAuth({
		appId,
		privateKey,
		clientId,
		clientSecret,
	});
}
