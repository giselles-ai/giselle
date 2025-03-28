import { giselleEngine } from "@/app/giselle-engine";
import { isWorkflowError } from "@giselle-sdk/giselle-engine";
import { Webhooks } from "@octokit/webhooks";
import type { WebhookEventName } from "@octokit/webhooks-types";
import { type NextRequest, after } from "next/server";
import { isUsageLimitError } from "../../../../../packages/giselle-engine/src/core";
import {
	WebhookPayloadError,
	defaultGitHubClientFactory,
	mockGitHubClientFactory,
	notifyWorkflowError,
} from "./utils";

// The maximum duration of server actions on this page is extended to 800 seconds through enabled fluid compute.
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 800;

// debug mode
// - skip verifying webhook signature
// - mock GitHub API calls
const isDebugMode = process.env.GITHUB_WEBHOOK_DEBUG === "1";
if (isDebugMode) {
	console.info("GitHub Webhook Debug Mode");
}

export async function POST(request: NextRequest) {
	const body = await request.text();

	if (!isDebugMode) {
		if (process.env.GITHUB_APP_WEBHOOK_SECRET === undefined) {
			throw new Error("GITHUB_APP_WEBHOOK_SECRET is not set");
		}
		const webhooks = new Webhooks({
			secret: process.env.GITHUB_APP_WEBHOOK_SECRET,
		});
		const signature = request.headers.get("X-Hub-Signature-256") ?? "";
		const verifyOK = await webhooks.verify(body, signature);
		if (!verifyOK) {
			return new Response("Failed to verify webhook", { status: 400 });
		}
	}
	const payload = JSON.parse(body);
	const installationId = getInstallationId(payload);
	if (installationId === undefined) {
		throw new Error("Installation ID is missing");
	}
	const githubClientFactory = isDebugMode
		? mockGitHubClientFactory
		: defaultGitHubClientFactory;
	const octokit = await githubClientFactory.createClient(installationId);

	try {
		after(async () => {
			try {
				const results = await giselleEngine.githubWebhook({
					delivery: request.headers.get("X-GitHub-Delivery") ?? "",
					event: request.headers.get("X-GitHub-Event") as WebhookEventName,
					payload,
					options: {
						reaction: async (owner, repo, comment_id) => {
							await octokit.request(
								"POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
								{
									owner,
									repo,
									comment_id,
									content: "eyes",
								},
							);
						},
						pullRequestDiff: async (owner, repo, number) => {
							const result = await octokit.request(
								"GET /repos/{owner}/{repo}/pulls/{pull_number}",
								{
									owner,
									repo,
									pull_number: number,
									mediaType: {
										format: "diff",
									},
								},
							);
							// need to cast the result to string
							// https://github.com/octokit/request.js/issues/463#issuecomment-1164800010
							const diff = result.data as unknown as string;
							return diff;
						},
					},
				});
				if (results === undefined) {
					return;
				}

				await Promise.all(
					results.map(async (result) => {
						switch (result.action) {
							case "github.issue_comment.create":
								await octokit.request(
									"POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
									{
										owner: result.issue.repo.owner,
										repo: result.issue.repo.name,
										issue_number: result.issue.number,
										body: result.content,
									},
								);
								break;
							case "github.pull_request_comment.create":
								await octokit.request(
									"POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
									{
										owner: result.pullRequest.repo.owner,
										repo: result.pullRequest.repo.name,
										issue_number: result.pullRequest.number,
										body: result.content,
									},
								);
								break;
							default: {
								const _exhaustiveCheck: never = result;
								throw new Error(`Unhandled action: ${_exhaustiveCheck}`);
							}
						}
					}),
				);
			} catch (error: unknown) {
				if (isWorkflowError(error) && isUsageLimitError(error.cause)) {
					await notifyWorkflowError(error.workspaceId, error.message);
					return;
				}
				throw error;
			}
		});
	} catch (e) {
		if (e instanceof WebhookPayloadError) {
			return new Response(e.message, { status: 400 });
		}
		throw e;
	}

	return new Response("Accepted", { status: 202 });
}

function getInstallationId(payload: unknown) {
	if (
		typeof payload === "object" &&
		payload !== null &&
		"installation" in payload &&
		typeof payload.installation === "object" &&
		payload.installation !== null &&
		"id" in payload.installation &&
		typeof payload.installation.id === "number"
	) {
		return payload.installation.id;
	}
	return undefined;
}
