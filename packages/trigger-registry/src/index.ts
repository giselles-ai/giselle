import {
	GitHubTriggerEvent,
	GitHubTriggerEventDiscussionCommentCreated,
	GitHubTriggerEventDiscussionCreated,
	type GitHubTriggerEventId,
	GitHubTriggerEventIssueClosed,
	GitHubTriggerEventIssueCommentCreated,
	GitHubTriggerEventIssueCreated,
	GitHubTriggerEventIssueLabeled,
	GitHubTriggerEventPullRequestClosed,
	GitHubTriggerEventPullRequestCommentCreated,
	GitHubTriggerEventPullRequestLabeled,
	GitHubTriggerEventPullRequestOpened,
	GitHubTriggerEventPullRequestReadyForReview,
	GitHubTriggerEventPullRequestReviewCommentCreated,
} from "@giselles-ai/protocol";
import z from "zod/v4";

interface PayloadItem {
	key: string;
	label: string;
	type: "text" | "multiline-text" | "number";
	optional?: boolean;
}

const githubTriggerRegistry = z.registry<{
	id: GitHubTriggerEventId;
	label: string;
	payload: PayloadItem[];
}>();

githubTriggerRegistry.add(GitHubTriggerEventIssueCreated, {
	id: GitHubTriggerEventIssueCreated.shape.id.value,
	label: "Issue Created",
	payload: [
		{
			key: "issueNumber",
			label: "Issue Number",
			type: "number",
		},
		{
			key: "title",
			label: "Title",
			type: "text",
		},
		{
			key: "body",
			label: "Body",
			type: "multiline-text",
			optional: true,
		},
	],
});

githubTriggerRegistry.add(GitHubTriggerEventIssueClosed, {
	id: GitHubTriggerEventIssueClosed.shape.id.value,
	label: "Issue Closed",
	payload: [
		{
			key: "issueNumber",
			label: "Issue Number",
			type: "number",
		},
		{
			key: "title",
			label: "Title",
			type: "text",
		},
		{
			key: "body",
			label: "Body",
			type: "multiline-text",
			optional: true,
		},
	],
});

githubTriggerRegistry.add(GitHubTriggerEventIssueCommentCreated, {
	id: GitHubTriggerEventIssueCommentCreated.shape.id.value,
	label: "Issue Comment Created",
	payload: [
		{
			key: "issueNumber",
			label: "Issue Number",
			type: "number",
		},
		{
			key: "issueTitle",
			label: "Issue Title",
			type: "text",
		},
		{
			key: "issueBody",
			label: "Issue Body",
			type: "multiline-text",
			optional: true,
		},
		{
			key: "body",
			label: "Body",
			type: "multiline-text",
			optional: true,
		},
	],
});

githubTriggerRegistry.add(GitHubTriggerEventIssueLabeled, {
	id: GitHubTriggerEventIssueLabeled.shape.id.value,
	label: "Issue Labeled",
	payload: [
		{
			key: "issueNumber",
			label: "Issue Number",
			type: "number",
		},
		{
			key: "issueTitle",
			label: "Issue Title",
			type: "text",
		},
		{
			key: "issueBody",
			label: "Issue Body",
			type: "multiline-text",
			optional: true,
		},
		{
			key: "labelName",
			label: "Label Name",
			type: "text",
		},
	],
});

githubTriggerRegistry.add(GitHubTriggerEventPullRequestCommentCreated, {
	id: GitHubTriggerEventPullRequestCommentCreated.shape.id.value,
	label: "Pull Request Comment Created",
	payload: [
		{
			key: "issueNumber",
			label: "Pull Request Number",
			type: "number",
		},
		{
			key: "issueTitle",
			label: "Pull Request Title",
			type: "text",
		},
		{
			key: "issueBody",
			label: "Pull Request Body",
			type: "multiline-text",
			optional: true,
		},
		{
			key: "body",
			label: "Body",
			type: "multiline-text",
			optional: true,
		},
		{
			key: "diff",
			label: "Diff",
			type: "multiline-text",
		},
	],
});

githubTriggerRegistry.add(GitHubTriggerEventPullRequestReviewCommentCreated, {
	id: GitHubTriggerEventPullRequestReviewCommentCreated.shape.id.value,
	label: "Pull Request Review Comment Created",
	payload: [
		{
			key: "id",
			label: "ID",
			type: "number",
		},
		{
			key: "body",
			label: "Body",
			type: "multiline-text",
		},
		{
			key: "diff",
			label: "Diff",
			type: "text",
		},
		{
			key: "previousCommentBody",
			label: "Previous Comment Body",
			type: "multiline-text",
		},
		{
			key: "pullRequestNumber",
			label: "Pull Request Number",
			type: "number",
		},
		{
			key: "pullRequestTitle",
			label: "Pull Request Title",
			type: "text",
		},
		{
			key: "pullRequestBody",
			label: "Pull Request Body",
			type: "multiline-text",
			optional: true,
		},
	],
});

githubTriggerRegistry.add(GitHubTriggerEventDiscussionCommentCreated, {
	id: GitHubTriggerEventDiscussionCommentCreated.shape.id.value,
	label: "Discussion Comment Created",
	payload: [
		{
			key: "body",
			label: "Body",
			type: "multiline-text",
		},
		{
			key: "discussionNumber",
			label: "Discussion Number",
			type: "number",
		},
		{
			key: "discussionTitle",
			label: "Discussion Title",
			type: "text",
		},
		{
			key: "discussionBody",
			label: "Discussion Body",
			type: "multiline-text",
		},
		{
			key: "discussionUrl",
			label: "Discussion URL",
			type: "text",
		},
		{
			key: "commentId",
			label: "Comment ID",
			type: "number",
		},
		{
			key: "parentCommentBody",
			label: "Parent Comment Body",
			type: "multiline-text",
		},
	],
});

githubTriggerRegistry.add(GitHubTriggerEventDiscussionCreated, {
	id: GitHubTriggerEventDiscussionCreated.shape.id.value,
	label: "Discussion Created",
	payload: [
		{
			key: "discussionNumber",
			label: "Discussion Number",
			type: "number",
		},
		{
			key: "discussionTitle",
			label: "Discussion Title",
			type: "text",
		},
		{
			key: "discussionBody",
			label: "Discussion Body",
			type: "multiline-text",
		},
		{
			key: "discussionUrl",
			label: "Discussion URL",
			type: "text",
		},
		{
			key: "categoryName",
			label: "Category Name",
			type: "text",
		},
	],
});

githubTriggerRegistry.add(GitHubTriggerEventPullRequestClosed, {
	id: GitHubTriggerEventPullRequestClosed.shape.id.value,
	label: "Discussion Created",
	payload: [
		{
			key: "title",
			label: "Pull Request Title",
			type: "text",
		},
		{
			key: "body",
			label: "Pull Request Body",
			type: "multiline-text",
		},
		{
			key: "number",
			label: "Pull Request Number",
			type: "number",
		},
		{
			key: "diff",
			label: "Pull Request Diff",
			type: "text",
		},
		{
			key: "pullRequestUrl",
			label: "Pull Request URL",
			type: "text",
		},
	],
});

githubTriggerRegistry.add(GitHubTriggerEventPullRequestLabeled, {
	id: GitHubTriggerEventPullRequestLabeled.shape.id.value,
	label: "Pull Request Labeled",
	payload: [
		{
			key: "pullRequestTitle",
			label: "Pull Request Title",
			type: "text",
		},
		{
			key: "pullRequestBody",
			label: "Pull Request Body",
			type: "multiline-text",
		},
		{
			key: "pullRequestNumber",
			label: "Pull Request Number",
			type: "number",
		},
		{
			key: "labelName",
			label: "Pull Request URL",
			type: "text",
		},
	],
});

githubTriggerRegistry.add(GitHubTriggerEventPullRequestOpened, {
	id: GitHubTriggerEventPullRequestOpened.shape.id.value,
	label: "Pull Request Opened",
	payload: [
		{
			key: "title",
			label: "Pull Request Title",
			type: "text",
		},
		{
			key: "body",
			label: "Pull Request Body",
			type: "multiline-text",
		},
		{
			key: "number",
			label: "Pull Request Number",
			type: "number",
		},
		{
			key: "diff",
			label: "Pull Request Diff",
			type: "text",
		},
		{
			key: "pullRequestUrl",
			label: "Pull Request URL",
			type: "text",
		},
	],
});

githubTriggerRegistry.add(GitHubTriggerEventPullRequestReadyForReview, {
	id: GitHubTriggerEventPullRequestReadyForReview.shape.id.value,
	label: "Pull Request Ready for Review",
	payload: [
		{
			key: "title",
			label: "Pull Request Title",
			type: "text",
		},
		{
			key: "body",
			label: "Pull Request Body",
			type: "multiline-text",
		},
		{
			key: "number",
			label: "Pull Request Number",
			type: "number",
		},
		{
			key: "diff",
			label: "Pull Request Diff",
			type: "text",
		},
		{
			key: "pullRequestUrl",
			label: "Pull Request URL",
			type: "text",
		},
	],
});

export const githubTriggerOptions = GitHubTriggerEvent.options
	.map((githubTriggerSchema) => {
		const registryData = githubTriggerRegistry.get(githubTriggerSchema);
		if (registryData === undefined) {
			return null;
		}
		return registryData;
	})
	.filter((registry) => registry !== null);

export function findGitHubTriggerOption(
	githubTriggerEventId: GitHubTriggerEventId,
) {
	return githubTriggerOptions.find(
		(option) => option.id === githubTriggerEventId,
	);
}
