import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";
import type { EmitterWebhookEvent } from "@octokit/webhooks";

export function assertIssueCommentEvent(
	payload: unknown,
): asserts payload is EmitterWebhookEvent<"issue_comment"> {
	if (payload === null || typeof payload !== "object") {
		throw new Error("Payload is not an object");
	}
	if (!("id" in payload)) {
		throw new Error("Payload is missing id field");
	}
	if (!("name" in payload)) {
		throw new Error("Payload is missing name field");
	}
	if (payload.name !== "issue_comment") {
		throw new Error("Payload name is not issue_comment");
	}
}

export async function createOctokit(installationId: number | string) {
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

	const auth = await createAppAuth({
		appId,
		privateKey,
		clientId,
		clientSecret,
	})({ type: "installation", installationId });

	return new Octokit({
		auth: auth.token,
	});
}
