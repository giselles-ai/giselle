import {
	GitHubFlowTriggerEvent,
	type GitHubTriggerEventId,
	GitHubTriggerEventIssueClosed,
	GitHubTriggerEventIssueCommentCreated,
	GitHubTriggerEventIssueCreated,
	GitHubTriggerEventIssueLabeled,
	GitHubTriggerEventPullRequestCommentCreated,
	GitHubTriggerEventPullRequestReviewCommentCreated,
} from "@giselles-ai/protocol";
import z from "zod/v4";

interface PayloadItem {
	key: string;
	label: string;
	type: "string" | "number";
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
			type: "string",
		},
		{
			key: "body",
			label: "Body",
			type: "string",
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
			type: "string",
		},
		{
			key: "body",
			label: "Body",
			type: "string",
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

githubTriggerRegistry.add(GitHubTriggerEventIssueCommentCreated, {
	id: GitHubTriggerEventIssueCommentCreated.shape.id.value,
	label: "Issue Comment Created",
	payload: [
		{
			key: "body",
			label: "Body",
			type: "string",
		},
		{
			key: "issueNumber",
			label: "Issue Number",
			type: "number",
		},
		{
			key: "issueTitle",
			label: "Issue Title",
			type: "string",
		},
		{
			key: "issueBody",
			label: "Issue Body",
			type: "string",
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
			type: "string",
		},
		{
			key: "issueBody",
			label: "Issue Body",
			type: "string",
		},
		{
			key: "labelName",
			label: "Label Name",
			type: "string",
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
			type: "string",
		},
		{
			key: "issueBody",
			label: "Pull Request Body",
			type: "string",
		},
		{
			key: "body",
			label: "Body",
			type: "string",
		},
		{
			key: "diff",
			label: "Diff",
			type: "string",
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
			type: "string",
		},
		{
			key: "diff",
			label: "Diff",
			type: "string",
		},
		{
			key: "previousCommentBody",
			label: "Previous Comment Body",
			type: "string",
		},
		{
			key: "pullRequestNumber",
			label: "Pull Request Number",
			type: "number",
		},
		{
			key: "pullRequestTitle",
			label: "Pull Request Title",
			type: "string",
		},
		{
			key: "pullRequestBody",
			label: "Pull Request Body",
			type: "string",
		},
	],
});

export const githubTriggerOptions = GitHubFlowTriggerEvent.options
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
