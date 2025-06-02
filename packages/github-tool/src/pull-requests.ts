import { octokit } from "./octokit";
import { getRepositoryFullname } from "./repository";
import type { GitHubAuthConfig } from "./types";

export async function getPullRequestDiff(args: {
	repositoryNodeId: string;
	pullNumber: number;
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
	return response.data as unknown as string;
}

export async function createPullRequestReviewComment(args: {
	repositoryNodeId: string;
	pullNumber: number;
	body: string;
	authConfig: GitHubAuthConfig;
	inReplyTo?: number;
	commitId?: string;
	path?: string;
	line?: number;
	side?: "LEFT" | "RIGHT";
	startLine?: number;
	startSide?: "LEFT" | "RIGHT";
	subjectType?: "line" | "file";
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
	if (args.inReplyTo !== undefined) {
		const response = await client.request(
			"POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/replies",
			{
				owner: repo.data.node.owner.login,
				repo: repo.data.node.name,
				pull_number: args.pullNumber,
				comment_id: args.inReplyTo,
				body: args.body,
			},
		);
		return response.data;
	}
	if (args.commitId === undefined) {
		throw new Error("commitId is required when not replying to a comment");
	}
	if (args.path === undefined) {
		throw new Error("path is required when not replying to a comment");
	}
	const response = await client.request(
		"POST /repos/{owner}/{repo}/pulls/{pull_number}/comments",
		{
			owner: repo.data.node.owner.login,
			repo: repo.data.node.name,
			pull_number: args.pullNumber,
			body: args.body,
			commit_id: args.commitId,
			path: args.path,
			line: args.line,
			side: args.side,
			start_line: args.startLine,
			start_side: args.startSide,
			subject_type: args.subjectType,
		},
	);
	return response.data;
}
