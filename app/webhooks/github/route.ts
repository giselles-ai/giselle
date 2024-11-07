import {
	buildAppInstallationClient,
	needsAdditionalPermissions,
	webhooks,
} from "@/services/external/github";
import type { EmitterWebhookEvent } from "@octokit/webhooks";
import type { WebhookEventName } from "@octokit/webhooks-types";
import { captureException } from "@sentry/nextjs";
import type { NextRequest } from "next/server";

function setupHandlers() {
	webhooks.on("issues", issuesHandler);
}

setupHandlers();

export async function POST(request: NextRequest) {
	const { id, name, signature, body } = await parseWebhookRequest(request);

	const verifyOK = await webhooks.verify(body, signature);
	if (!verifyOK) {
		return new Response("Failed to verify webhook", { status: 400 });
	}

	try {
		const payload = JSON.parse(body);
		await webhooks.receive({ id, name, payload } as EmitterWebhookEvent);
		return new Response("OK");
	} catch (error) {
		if (requireAdditionalPermission(error)) {
			// TODO: notify the user that additional permissions are required
			throw new Error("Additional permissions required");
		}

		// TODO: consider filtering out expected errors
		captureException(error);
		return new Response("Failed to receive webhook", {
			status: 400,
		});
	}
}

async function parseWebhookRequest(request: NextRequest) {
	const id = request.headers.get("X-GitHub-Delivery") ?? "";
	const name = request.headers.get("X-GitHub-Event") as WebhookEventName;
	const signature = request.headers.get("X-Hub-Signature-256") ?? "";
	const body = await request.text();
	return { id, name, signature, body };
}

function requireAdditionalPermission(error: unknown) {
	if (error instanceof AggregateError) {
		for (const e of error.errors) {
			if (
				needsAdditionalPermissions(e) ||
				needsAdditionalPermissions(error.cause)
			) {
				return true;
			}
		}
	}
	return needsAdditionalPermissions(error);
}

async function issuesHandler(event: EmitterWebhookEvent<"issues">) {
	const payload = event.payload;

	const issueNumber = payload.issue.number;
	const repoName = payload.repository.name;
	const repoOwner = payload.repository.owner.login;
	const commentBody = `Hello from the GitHub App! @${payload.issue.user?.login}`;

	const installation = payload.installation;
	if (!installation) {
		throw new Error("No installation found in payload");
	}
	const octokit = await buildAppInstallationClient(installation.id);

	await octokit.request(
		"POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
		{
			owner: repoOwner,
			repo: repoName,
			issue_number: issueNumber,
			body: commentBody,
		},
	);
}
