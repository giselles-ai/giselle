import type { FlowTrigger, Output } from "@giselle-sdk/data-type";
import { FlowTriggerId, OutputId } from "@giselle-sdk/data-type";
import { type GitHubTriggerEventId, githubTriggers } from "@giselle-sdk/flow";
import type { WebhookEvent } from "@giselle-sdk/github-tool";
import { describe, expect, test, vi } from "vitest";
import { resolveTrigger } from "./trigger-utils";

vi.mock("@giselle-sdk/github-tool", async () => {
	const actual = await vi.importActual<
		typeof import("@giselle-sdk/github-tool")
	>("@giselle-sdk/github-tool");
	return {
		...actual,
		getPullRequestDiff: vi.fn().mockResolvedValue("diff"),
		getPullRequestReviewComment: vi
			.fn()
			.mockResolvedValue({ body: "previous" }),
	};
});

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
		eventId === "github.pull_request_comment.created" ||
		eventId === "github.pull_request_review_comment.created"
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

function createIssueLabeledEvent(
	issue: { title: string; body: string | null; number: number },
	labelName: string,
): WebhookEvent {
	return {
		name: "issues.labeled",
		data: {
			payload: {
				issue,
				label: { name: labelName },
			},
		},
	} as WebhookEvent<"issues.labeled">;
}

function createIssueCommentEvent(issue: {
	title: string;
	body: string | null;
	number: number;
	pull_request?: Record<string, never>;
}): WebhookEvent {
	return {
		name: "issue_comment.created",
		data: {
			payload: {
				comment: { body: "/giselle hi" },
				issue,
				repository: { node_id: "r_1234" },
			},
		},
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

function createPullRequestLabeledEvent(
	pr: { title: string; body: string | null; number: number },
	labelName: string,
): WebhookEvent {
	return {
		name: "pull_request.labeled",
		data: {
			payload: {
				pull_request: pr,
				label: { name: labelName },
			},
		},
	} as WebhookEvent<"pull_request.labeled">;
}

function createPullRequestReviewCommentEvent(pr: {
	title: string;
	body: string | null;
	number: number;
}): WebhookEvent {
	return {
		name: "pull_request_review_comment.created",
		data: {
			payload: {
				pull_request: pr,
				repository: { node_id: "r_1234" },
				comment: {
					body: "/giselle hi",
					diff_hunk: "@@ -1 +1 @@\n+diff",
					id: 1,
				},
			},
		},
	} as WebhookEvent<"pull_request_review_comment.created">;
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

	describe("issue labeled", () => {
		const webhookEvent = createIssueLabeledEvent(
			{
				title: "Labeled issue title",
				body: "Labeled issue body",
				number: 7,
			},
			"bug",
		);
		const githubTrigger = githubTriggers["github.issue.labeled"];
		test.each([
			["title", "Labeled issue title"],
			["body", "Labeled issue body"],
			["issueNumber", "7"],
			["labelName", "bug"],
		] as const)("resolve %s", async (accessor, expected) => {
			const trigger = createTrigger("github.issue.labeled");
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

		describe("pull request review comment", () => {
			const webhookEvent = createPullRequestReviewCommentEvent({
				title: "PR title",
				body: "PR body",
				number: 6,
			});
			const githubTrigger =
				githubTriggers["github.pull_request_review_comment.created"];
			test.each([
				["body", "hi"],
				["pullRequestBody", "PR body"],
				["pullRequestNumber", "6"],
				["pullRequestTitle", "PR title"],
			] as const)("resolve %s", async (accessor, expected) => {
				const trigger = createTrigger(
					"github.pull_request_review_comment.created",
				);
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
		describe(id, () => {
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
				["diff", "diff"],
			])("resolve %s", async (accessor, expected) => {
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

	describe("pull request labeled", () => {
		const webhookEvent = createPullRequestLabeledEvent(
			{
				title: "Labeled PR title",
				body: "Labeled PR body",
				number: 8,
			},
			"enhancement",
		);
		const githubTrigger = githubTriggers["github.pull_request.labeled"];
		test.each([
			["pullRequestTitle", "Labeled PR title"],
			["pullRequestBody", "Labeled PR body"],
			["pullRequestNumber", "8"],
			["labelName", "enhancement"],
		] as const)("resolve %s", async (accessor, expected) => {
			const trigger = createTrigger("github.pull_request.labeled");
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
});
