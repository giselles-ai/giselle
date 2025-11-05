import { z } from "zod/v4";

const githubCreateIssueAction = {
	command: {
		id: "github.create.issue" as const,
		parameters: z.object({
			title: z.string(),
			body: z.string(),
		}),
	},
};

const githubCreateIssueCommentAction = {
	command: {
		id: "github.create.issueComment" as const,
		parameters: z.object({
			issueNumber: z.coerce.number(),
			body: z.string(),
		}),
	},
};

const githubCreatePullRequestCommentAction = {
	command: {
		id: "github.create.pullRequestComment" as const,
		parameters: z.object({
			pullNumber: z.coerce.number(),
			body: z.string(),
		}),
	},
};

const githubUpdatePullRequestAction = {
	command: {
		id: "github.update.pullRequest" as const,
		parameters: z.object({
			pullNumber: z.coerce.number(),
			title: z.string(),
			body: z.string(),
		}),
	},
};

const githubReplyPullRequestReviewCommentAction = {
	command: {
		id: "github.reply.pullRequestReviewComment" as const,
		parameters: z.object({
			pullNumber: z.coerce.number(),
			commentId: z.coerce.number(),
			body: z.string(),
		}),
	},
};

const githubGetDiscussionAction = {
	command: {
		id: "github.get.discussion" as const,
		parameters: z.object({
			discussionNumber: z.coerce.number(),
		}),
	},
};

const githubCreateDiscussionCommentAction = {
	command: {
		id: "github.create.discussionComment" as const,
		parameters: z.object({
			discussionNumber: z.coerce.number(),
			body: z.string(),
			commentId: z.coerce.number().optional(),
		}),
	},
};

export const githubActions = {
	"github.create.issue": githubCreateIssueAction,
	"github.create.issueComment": githubCreateIssueCommentAction,
	"github.create.pullRequestComment": githubCreatePullRequestCommentAction,
	"github.update.pullRequest": githubUpdatePullRequestAction,
	"github.reply.pullRequestReviewComment":
		githubReplyPullRequestReviewCommentAction,
	"github.get.discussion": githubGetDiscussionAction,
	"github.create.discussionComment": githubCreateDiscussionCommentAction,
} as const;
