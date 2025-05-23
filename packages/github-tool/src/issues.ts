import { octokit } from "./octokit";
import { getRepositoryFullname } from "./repository";
import type { GitHubAuthConfig } from "./types";

export async function createIssue(args: {
	repositoryNodeId: string;
	title: string;
	body: string;
	authConfig: GitHubAuthConfig;
}) {
	const client = octokit(args.authConfig);
	const repo = await getRepositoryFullname(
		args.repositoryNodeId,
		args.authConfig,
	);
	if (repo.error || repo.data === undefined) {
		throw new Error(`Failed to get repository information: ${repo.error}`);
	}
	if (repo.data.node?.__typename !== "Repository") {
		throw new Error(`Invalid repository type: ${repo.data.node?.__typename}`);
	}
	const response = await client.request("POST /repos/{owner}/{repo}/issues", {
		owner: repo.data.node.owner.login,
		repo: repo.data.node.name,
		title: args.title,
		body: args.body,
	});
	return response.data;
}

export async function createIssueComment(args: {
	repositoryNodeId: string;
	issueNumber: number;
	body: string;
	authConfig: GitHubAuthConfig;
}) {
	const client = octokit(args.authConfig);
	const repo = await getRepositoryFullname(
		args.repositoryNodeId,
		args.authConfig,
	);
	if (repo.error || repo.data === undefined) {
		throw new Error(`Failed to get repository information: ${repo.error}`);
	}
	if (repo.data.node?.__typename !== "Repository") {
		throw new Error(`Invalid repository type: ${repo.data.node?.__typename}`);
	}
	const response = await client.request(
		"POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
		{
			owner: repo.data.node.owner.login,
			repo: repo.data.node.name,
			issue_number: args.issueNumber,
			body: args.body,
		},
	);
	return response.data;
}

export async function createPullRequestComment(args: {
	repositoryNodeId: string;
	pullNumber: number;
	body: string;
	authConfig: GitHubAuthConfig;
}) {
	const client = octokit(args.authConfig);
	const repo = await getRepositoryFullname(
		args.repositoryNodeId,
		args.authConfig,
	);
	if (repo.error || repo.data === undefined) {
		throw new Error(`Failed to get repository information: ${repo.error}`);
	}
	if (repo.data.node?.__typename !== "Repository") {
		throw new Error(`Invalid repository type: ${repo.data.node?.__typename}`);
	}
	const response = await client.request(
		"POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
		{
			owner: repo.data.node.owner.login,
			repo: repo.data.node.name,
			issue_number: args.pullNumber,
			body: args.body,
		},
	);
	return response.data;
}

export async function updateIssueComment(args: {
	repositoryNodeId: string;
	commentId: number;
	body: string;
	authConfig: GitHubAuthConfig;
}) {
	const client = octokit(args.authConfig);
	const repo = await getRepositoryFullname(
		args.repositoryNodeId,
		args.authConfig,
	);
	if (repo.error || repo.data === undefined) {
		throw new Error(`Failed to get repository information: ${repo.error}`);
	}
	if (repo.data.node?.__typename !== "Repository") {
		throw new Error(`Invalid repository type: ${repo.data.node?.__typename}`);
	}
	const response = await client.request(
		"PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}",
		{
			owner: repo.data.node.owner.login,
			repo: repo.data.node.name,
			comment_id: args.commentId,
			body: args.body,
		},
	);
	return response.data;
}
