import { compressLargeDiff } from "./lib/diff-compression";
import { octokit } from "./octokit";
import { getRepositoryFullname } from "./repository";
import type { GitHubAuthConfig } from "./types";

export async function getPullRequestDiff(args: {
	repositoryNodeId: string;
	pullNumber: number;
	authConfig: GitHubAuthConfig;
	maxSize?: number;
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
		"GET /repos/{owner}/{repo}/pulls/{pull_number}",
		{
			owner: repo.data.node.owner.login,
			repo: repo.data.node.name,
			pull_number: args.pullNumber,
			headers: {
				accept: "application/vnd.github.v3.diff",
			},
		},
	);
	const diff = response.data as unknown as string;
	return compressLargeDiff(diff, args.maxSize);
}

export async function getPullRequestReviewComment(args: {
	repositoryNodeId: string;
	commentId: number;
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
		"GET /repos/{owner}/{repo}/pulls/comments/{comment_id}",
		{
			owner: repo.data.node.owner.login,
			repo: repo.data.node.name,
			comment_id: args.commentId,
		},
	);
	return response.data;
}
export async function replyPullRequestReviewComment(args: {
	repositoryNodeId: string;
	pullNumber: number;
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
		"POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies",
		{
			owner: repo.data.node.owner.login,
			repo: repo.data.node.name,
			pull_number: args.pullNumber,
			comment_id: args.commentId,
			body: args.body,
		},
	);
	return response.data;
}

export async function updatePullRequestReviewComment(args: {
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
		"PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id}",
		{
			owner: repo.data.node.owner.login,
			repo: repo.data.node.name,
			comment_id: args.commentId,
			body: args.body,
		},
	);
	return response.data;
}
