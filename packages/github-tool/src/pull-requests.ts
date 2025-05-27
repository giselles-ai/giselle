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
