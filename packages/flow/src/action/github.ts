import { z } from "zod";
import type { ActionBase } from "../base";

export const provider = "github" as const;

export interface GitHubActionBase extends ActionBase {
	provider: typeof provider;
}

export const githubCreateIssueAction = {
	provider,
	command: {
		id: "github.create.issue",
		label: "Create Issue",
		parameters: z.object({
			title: z.string(),
			body: z.string(),
		}),
	},
} as const satisfies GitHubActionBase;

export const githubCreateIssueCommentAction = {
	provider,
	command: {
		id: "github.create.issueComment",
		label: "Create Issue Comment",
		parameters: z.object({
			issueNumber: z.number(),
			body: z.string(),
		}),
	},
} as const satisfies GitHubActionBase;

export const actions = {
	[githubCreateIssueAction.command.id]: githubCreateIssueAction,
	[githubCreateIssueCommentAction.command.id]: githubCreateIssueCommentAction,
} as const;

export type GitHubAction =
	| typeof githubCreateIssueAction
	| typeof githubCreateIssueCommentAction;

export type ActionCommandId = keyof typeof actions;

export function actionIdToLabel(triggerId: ActionCommandId) {
	switch (triggerId) {
		case "github.create.issue":
			return githubCreateIssueAction.command.label;
		case "github.create.issueComment":
			return githubCreateIssueCommentAction.command.label;
		default: {
			const exhaustiveCheck: never = triggerId;
			throw new Error(`Unknown trigger ID: ${exhaustiveCheck}`);
		}
	}
}
