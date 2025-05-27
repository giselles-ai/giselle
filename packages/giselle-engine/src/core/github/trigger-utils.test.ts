import type { FlowTrigger, Output } from "@giselle-sdk/data-type";
import { FlowTriggerId, OutputId } from "@giselle-sdk/data-type";
import { type GitHubTriggerEventId, githubTriggers } from "@giselle-sdk/flow";
import type { WebhookEvent } from "@giselle-sdk/github-tool";
import { describe, expect, test } from "vitest";
import { resolveTrigger } from "./trigger-utils";

function createOutput(accessor: string): Output {
	return {
		id: OutputId.generate(),
		label: accessor,
		accessor,
	};
}

function createTrigger(eventId: GitHubTriggerEventId): FlowTrigger {
	const event =
		eventId === "github.issue_comment.created" ||
		eventId === "github.pull_request_comment.created"
			? { id: eventId, conditions: { callsign: "giselle" } }
			: { id: eventId };
	return {
		id: FlowTriggerId.generate(),
		workspaceId: "wrks-test",
		nodeId: "nd-test",
		enable: true,
		configuration: {
			provider: "github",
			event,
			installationId: 1,
			repositoryNodeId: "repo-node",
		},
	} as FlowTrigger;
}

function createIssueEvent(
	name: "issues.opened" | "issues.closed",
	issue: { title: string; body: string | null; number: number },
): WebhookEvent {
	return {
		name,
		data: { payload: { issue } },
	} as WebhookEvent<typeof name>;
}

function createIssueCommentEvent(issue: {
	title: string;
	body: string | null;
	number: number;
	pull_request?: Record<string, never>;
}): WebhookEvent {
	return {
		name: "issue_comment.created",
		data: { payload: { comment: { body: "/giselle hi" }, issue } },
	} as WebhookEvent<"issue_comment.created">;
}

function createPullRequestEvent(
	name:
		| "pull_request.opened"
		| "pull_request.ready_for_review"
		| "pull_request.closed",
	pr: { title: string; body: string | null; number: number; html_url: string },
): WebhookEvent {
	return {
		name,
		data: { payload: { pull_request: pr, repository: { node_id: "r_1234" } } },
	} as WebhookEvent<typeof name>;
}

const appAuth = {
	appId: "app-id",
	privateKey: "private-key",
	installationId: 1234,
};

describe("resolveTrigger", () => {
	describe("issue created", () => {
		const webhookEvent = createIssueEvent("issues.opened", {
			title: "Issue title",
			body: "Issue body",
			number: 1,
		});
		const githubTrigger = githubTriggers["github.issue.created"];
		test.each([
			["title", "Issue title"],
			["body", "Issue body"],
			["issueNumber", "1"],
		] as const)("resolve %s", async (accessor, expected) => {
			const trigger = createTrigger("github.issue.created");
			const output = createOutput(accessor);
			const result = await resolveTrigger({
				output,
				githubTrigger,
				trigger,
				webhookEvent,
				...appAuth,
			});
			expect(result).toEqual({
				type: "generated-text",
				outputId: output.id,
				content: expected,
			});
		});
	});

	describe("issue closed", () => {
		const webhookEvent = createIssueEvent("issues.closed", {
			title: "Closed title",
			body: "Closed body",
			number: 2,
		});
		const githubTrigger = githubTriggers["github.issue.closed"];
		test.each([
			["title", "Closed title"],
			["body", "Closed body"],
			["issueNumber", "2"],
		] as const)("resolve %s", async (accessor, expected) => {
			const trigger = createTrigger("github.issue.closed");
			const output = createOutput(accessor);
			const result = await resolveTrigger({
				output,
				githubTrigger,
				trigger,
				webhookEvent,
				...appAuth,
			});
			expect(result).toEqual({
				type: "generated-text",
				outputId: output.id,
				content: expected,
			});
		});
	});

	describe("issue comment", () => {
		const webhookEvent = createIssueCommentEvent({
			title: "Issue title",
			body: "Issue body",
			number: 3,
		});
		const githubTrigger = githubTriggers["github.issue_comment.created"];
		test.each([
			["body", "hi"],
			["issueBody", "Issue body"],
			["issueNumber", "3"],
			["issueTitle", "Issue title"],
		] as const)("resolve %s", async (accessor, expected) => {
			const trigger = createTrigger("github.issue_comment.created");
			const output = createOutput(accessor);
			const result = await resolveTrigger({
				output,
				githubTrigger,
				trigger,
				webhookEvent,
				...appAuth,
			});
			expect(result).toEqual({
				type: "generated-text",
				outputId: output.id,
				content: expected,
			});
		});
	});

	describe("pull request comment", () => {
		const webhookEvent = createIssueCommentEvent({
			title: "PR title",
			body: "PR body",
			number: 4,
			pull_request: {},
		});
		const githubTrigger = githubTriggers["github.pull_request_comment.created"];
		test.each([
			["body", "hi"],
			["issueBody", "PR body"],
			["issueNumber", "4"],
			["issueTitle", "PR title"],
		] as const)("resolve %s", async (accessor, expected) => {
			const trigger = createTrigger("github.pull_request_comment.created");
			const output = createOutput(accessor);
			const result = await resolveTrigger({
				output,
				githubTrigger,
				trigger,
				webhookEvent,
				...appAuth,
			});
			expect(result).toEqual({
				type: "generated-text",
				outputId: output.id,
				content: expected,
			});
		});
	});

	const prCases = [
		{
			id: "github.pull_request.opened" as GitHubTriggerEventId,
			name: "pull_request.opened" as const,
			title: "PR opened",
		},
		{
			id: "github.pull_request.ready_for_review" as GitHubTriggerEventId,
			name: "pull_request.ready_for_review" as const,
			title: "PR ready",
		},
		{
			id: "github.pull_request.closed" as GitHubTriggerEventId,
			name: "pull_request.closed" as const,
			title: "PR closed",
		},
	];

	for (const { id, name, title } of prCases) {
		describe.skip(id, () => {
			const webhookEvent = createPullRequestEvent(name, {
				title,
				body: `${title} body`,
				number: 5,
				html_url: "https://example.com/pr/5",
			});
			const githubTrigger = githubTriggers[id];
			test.each([
				["title", title],
				["body", `${title} body`],
				["number", "5"],
				["pullRequestUrl", "https://example.com/pr/5"],
			] as const)("resolve %s", async (accessor, expected) => {
				const trigger = createTrigger(id);
				const output = createOutput(accessor);
				const result = await resolveTrigger({
					output,
					githubTrigger,
					trigger,
					webhookEvent,
					...appAuth,
				});
				expect(result).toEqual({
					type: "generated-text",
					outputId: output.id,
					content: expected,
				});
			});
		});
	}
});
