import {
	GitHubActionCommand,
	type GitHubActionCommandId,
	GithubCreateDiscussionCommentActionCommand,
	GithubCreateIssueActionCommand,
	GithubCreateIssueCommentActionCommand,
	GithubCreatePullRequestCommentActionCommand,
	GithubGetDiscussionActionCommand,
	GithubReplyPullRequestReviewCommentActionCommand,
	GithubUpdatePullRequestActionCommand,
} from "@giselles-ai/protocol";
import z from "zod/v4";

interface PayloadItem {
	key: string;
	label: string;
	type: "string" | "number";
	optional?: boolean;
}

const githubActionRegistry = z.registry<{
	id: GitHubActionCommandId;
	label: string;
	payload: PayloadItem[];
}>();

githubActionRegistry.add(GithubCreateIssueActionCommand, {
	id: GithubCreateIssueActionCommand.shape.id.value,
	label: "Create Issue",
	payload: [
		{
			key: "title",
			label: "Title",
			type: "string",
		},
		{
			key: "body",
			label: "Body",
			type: "string",
		},
	],
});

githubActionRegistry.add(GithubCreateDiscussionCommentActionCommand, {
	id: GithubCreateDiscussionCommentActionCommand.shape.id.value,
	label: "Create Discussion Comment",
	payload: [
		{
			key: "discussionNumber",
			label: "Discussion number",
			type: "number",
		},
		{
			key: "body",
			label: "Body",
			type: "string",
		},
		{
			key: "commentId",
			label: "Comment ID",
			type: "number",
			optional: true,
		},
	],
});

githubActionRegistry.add(GithubCreateIssueCommentActionCommand, {
	id: GithubCreateIssueCommentActionCommand.shape.id.value,
	label: "Create Issue Comment",
	payload: [
		{
			key: "issueNumber",
			label: "Issue number",
			type: "number",
		},
		{
			key: "body",
			label: "Body",
			type: "string",
		},
	],
});

githubActionRegistry.add(GithubCreatePullRequestCommentActionCommand, {
	id: GithubCreatePullRequestCommentActionCommand.shape.id.value,
	label: "Create Pull Request Comment",
	payload: [
		{
			key: "pullRequestNumber",
			label: "Pull Request number",
			type: "number",
		},
		{
			key: "body",
			label: "Body",
			type: "string",
		},
	],
});

githubActionRegistry.add(GithubGetDiscussionActionCommand, {
	id: GithubGetDiscussionActionCommand.shape.id.value,
	label: "Get Discussion",
	payload: [
		{
			key: "discussionNumber",
			label: "Discussion number",
			type: "number",
		},
	],
});

githubActionRegistry.add(GithubReplyPullRequestReviewCommentActionCommand, {
	id: GithubReplyPullRequestReviewCommentActionCommand.shape.id.value,
	label: "Reply Pull Request Review Comment",
	payload: [
		{
			key: "pullRequestNumber",
			label: "Pull Request number",
			type: "number",
		},
		{
			key: "commentId",
			label: "Comment ID",
			type: "number",
		},
		{
			key: "body",
			label: "Body",
			type: "string",
		},
	],
});

githubActionRegistry.add(GithubUpdatePullRequestActionCommand, {
	id: GithubUpdatePullRequestActionCommand.shape.id.value,
	label: "Update Pull Request",
	payload: [
		{
			key: "pullRequestNumber",
			label: "Pull Request number",
			type: "number",
		},
		{
			key: "title",
			label: "Title",
			type: "string",
		},
		{
			key: "body",
			label: "Body",
			type: "string",
		},
	],
});

export const githubActionOptions = GitHubActionCommand.options
	.map((githubActionSchema) => {
		const registryData = githubActionRegistry.get(githubActionSchema);
		if (registryData === undefined) {
			return null;
		}
		return registryData;
	})
	.filter((registry) => registry !== null);

export function findGitHubActionOption(
	githubActionCommandId: GitHubActionCommandId,
) {
	return githubActionOptions.find(
		(option) => option.id === githubActionCommandId,
	);
}
