import { z } from "zod";
import type { ActionBase } from "../base";

const provider = "github" as const;

export interface GitHubAction extends ActionBase {
	parameters: z.AnyZodObject;
}

export const githubCreateIssueAction = {
	provider,
	id: "github.create.issue",
	label: "Create Issue",
	parameters: z.object({
		title: z.string(),
		body: z.string(),
		repositoryOwner: z.string(),
		repositoryName: z.string(),
	}),
} as const satisfies GitHubAction;

export const githubCreateIssueCommentAction = {
	provider,
	id: "github.create.issue.comment",
	label: "Create Issue Comment",
	parameters: z.object({
		issueNumber: z.number(),
		body: z.string(),
		repositoryOwner: z.string(),
		repositoryName: z.string(),
	}),
} as const satisfies GitHubAction;

export const actions = [
	githubCreateIssueAction,
	githubCreateIssueCommentAction,
] as const;
