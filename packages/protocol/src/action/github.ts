import z from "zod/v4";
import { ActionBase, ActionCommandBase } from "./base";
import { actionMetadataRegistory } from "./meta";

export const GithubCreateIssueActionCommand = ActionCommandBase.extend({
	id: z.literal("github.create.issue"),
	parameters: z.object({
		title: z.string(),
		body: z.string(),
	}),
});
actionMetadataRegistory.add(GithubCreateIssueActionCommand, {
	label: "Create Issue",
});

export const GithubCreateIssueCommentActionCommand = ActionCommandBase.extend({
	id: z.literal("github.create.issueComment"),
	parameters: z.object({
		issueNumber: z.coerce.number(),
		body: z.string(),
	}),
});
actionMetadataRegistory.add(GithubCreateIssueCommentActionCommand, {
	label: "Create Issue Comment",
});

export const GithubCreatePullRequestCommentActionCommand =
	ActionCommandBase.extend({
		id: z.literal("github.create.pullRequestComment"),
		parameters: z.object({
			pullNumber: z.coerce.number(),
			body: z.string(),
		}),
	});
actionMetadataRegistory.add(GithubCreatePullRequestCommentActionCommand, {
	label: "Create Pull Request Comment",
});

export const GithubUpdatePullRequestActionCommand = ActionCommandBase.extend({
	id: z.literal("github.update.pullRequest"),
	parameters: z.object({
		pullNumber: z.coerce.number(),
		title: z.string(),
		body: z.string(),
	}),
});
actionMetadataRegistory.add(GithubUpdatePullRequestActionCommand, {
	label: "Update Pull Request",
});

export const GithubReplyPullRequestReviewCommentActionCommand =
	ActionCommandBase.extend({
		id: z.literal("github.reply.pullRequestReviewComment"),
		parameters: z.object({
			pullNumber: z.coerce.number(),
			commentId: z.coerce.number(),
			body: z.string(),
		}),
	});
actionMetadataRegistory.add(GithubReplyPullRequestReviewCommentActionCommand, {
	label: "Reply to Pull Request Review Comment",
});

export const GithubGetDiscussionActionCommand = ActionCommandBase.extend({
	id: z.literal("github.get.discussion"),
	parameters: z.object({
		discussionNumber: z.coerce.number(),
	}),
});
actionMetadataRegistory.add(GithubGetDiscussionActionCommand, {
	label: "Get Discussion",
});

export const GithubCreateDiscussionCommentActionCommand =
	ActionCommandBase.extend({
		id: z.literal("github.create.discussionComment"),
		parameters: z.object({
			discussionNumber: z.coerce.number(),
			body: z.string(),
			commentId: z.coerce.number().optional(),
		}),
	});
actionMetadataRegistory.add(GithubCreateDiscussionCommentActionCommand, {
	label: "Create Discussion Comment",
});

export const GitHubActionCommand = z.union([
	GithubCreateIssueActionCommand,
	GithubCreateIssueCommentActionCommand,
	GithubCreatePullRequestCommentActionCommand,
	GithubUpdatePullRequestActionCommand,
	GithubReplyPullRequestReviewCommentActionCommand,
	GithubGetDiscussionActionCommand,
	GithubCreateDiscussionCommentActionCommand,
]);

export const GitHubAction = ActionBase.extend({
	id: z.literal("github"),
	command: GitHubActionCommand,
});

export const GitHubActionCommandId = z.union(
	GitHubActionCommand.options.map((option) => option.shape.id),
);
export type GitHubActionCommandId = z.infer<typeof GitHubActionCommandId>;
