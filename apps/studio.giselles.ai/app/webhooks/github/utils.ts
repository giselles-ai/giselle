import { type agents, db, teamMemberships, users } from "@/drizzle";
import { type EmailRecipient, sendEmail } from "@/services/external/email";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";
import type { EmitterWebhookEvent } from "@octokit/webhooks";
import { eq } from "drizzle-orm";

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
	agent: typeof agents.$inferSelect,
	error: string,
) {
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
}
