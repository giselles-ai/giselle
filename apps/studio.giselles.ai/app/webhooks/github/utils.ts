import { db, teamMemberships, users } from "@/drizzle";
import { type EmailRecipient, sendEmail } from "@/services/external/email";
import type { WorkspaceId } from "@giselle-sdk/data-type";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";
import type { EmitterWebhookEvent } from "@octokit/webhooks";
import { eq } from "drizzle-orm";

export class WebhookPayloadError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PayloadError";
		Object.setPrototypeOf(this, WebhookPayloadError.prototype);
	}
}

interface GitHubClientFactory {
	createClient(installationId: number): Promise<Octokit>;
}

export const defaultGitHubClientFactory: GitHubClientFactory = {
	createClient: async (installationId: number) => {
		return await createOctokit(installationId);
	},
};

export const mockGitHubClientFactory: GitHubClientFactory = {
	createClient: async (installationId: number) =>
		({
			// biome-ignore lint/suspicious/noExplicitAny: mock
			request: async (route: string, params?: any) => {
				console.log("Mock GitHub API call:", { route, params });
				return {
					data: {
						id: "mock-comment-id",
						body: params?.body,
					},
				};
			},
		}) as Octokit,
};

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
		throw new Error(`Payload name: ${payload.name} is not issue_comment`);
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

// Notify workflow error to team members
export async function notifyWorkflowError(
	workspaceId: WorkspaceId,
	error: string,
) {
	const agent = await db.query.agents.findFirst({
		where: (agents, { eq }) => eq(agents.workspaceId, workspaceId),
	});
	if (!agent) {
		throw new Error("Agent not found");
	}
	const teamMembers = await db
		.select({ userDisplayName: users.displayName, userEmail: users.email })
		.from(teamMemberships)
		.innerJoin(users, eq(teamMemberships.userDbId, users.dbId))
		.where(eq(teamMemberships.teamDbId, agent.teamDbId));

	if (teamMembers.length === 0) {
		return;
	}

	const subject = `[Giselle] Workflow failure: ${agent.name} (ID: ${agent.id})`;
	const body = `Workflow failed with error:
	${error}
	`.replaceAll("\t", "");

	const recipients: EmailRecipient[] = teamMembers.map((user) => ({
		userDisplayName: user.userDisplayName ?? "",
		userEmail: user.userEmail ?? "",
	}));

	await sendEmail(subject, body, recipients);
	console.log(
		`[notifyWorkflowError] Sent error notification for agent ${agent.id}: ${body}`,
	);
}
