import {
	GitHubWebhookUnauthorizedError,
	verifyRequest,
} from "@giselles-ai/github-tool";
import { after } from "next/server";
import { giselle, githubWebhookCallbacks } from "@/app/giselle";

export async function POST(request: Request) {
	try {
		await verifyRequest({
			secret:
				giselle.getContext().integrationConfigs?.github?.authV2.webhookSecret ??
				"",
			request,
		});
	} catch (e) {
		if (GitHubWebhookUnauthorizedError.isInstance(e)) {
			return new Response("Unauthorized", { status: 401 });
		}
		return new Response("Internal Server Error", { status: 500 });
	}

	after(() =>
		giselle.handleGitHubWebhookV2({
			request,
			...githubWebhookCallbacks,
		}),
	);

	return new Response("Accepted", { status: 202 });
}
