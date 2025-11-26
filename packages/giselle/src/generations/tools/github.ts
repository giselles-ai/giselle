import type { Tool } from "@giselles-ai/language-model-registry";
import { hasSchema } from "@giselles-ai/language-model-registry";
import type { Octokit } from "@octokit/core";
import type { ToolSet } from "ai";
import { tool as defineTool } from "ai";

type GitHubToolExecutor = (
	params: unknown,
	octokit: Octokit,
) => Promise<unknown>;

const toolExecutors: Record<string, GitHubToolExecutor> = {
	addIssueComment: async (params, octokit) => {
		const { body, issueNumber, owner, repo } = params as {
			body: string;
			issueNumber: number;
			owner: string;
			repo: string;
		};
		const response = await octokit.request(
			"POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
			{
				owner,
				repo,
				issue_number: issueNumber,
				body,
			},
		);
		return response.data;
	},
	addPullRequestReviewComment: async (params, octokit) => {
		const {
			body,
			commitId,
			inReplyTo,
			line,
			owner,
			path,
			pullNumber,
			repo,
			side,
			startLine,
			startSide,
			subjectType,
		} = params as {
			body: string;
			commitId?: string;
			inReplyTo?: number;
			line?: number;
			owner: string;
			path?: string;
			pullNumber: number;
			repo: string;
			side?: "LEFT" | "RIGHT";
			startLine?: number;
			startSide?: "LEFT" | "RIGHT";
			subjectType?: "line" | "file";
		};

		if (inReplyTo) {
			const response = await octokit.request(
				"POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies",
				{
					owner,
					repo,
					pull_number: pullNumber,
					comment_id: inReplyTo,
					body,
				},
			);
			return response.data;
		}

		if (commitId === undefined) {
			return "No commit ID provided";
		}
		if (path === undefined) {
			return "No path provided";
		}
		const response = await octokit.request(
			"POST /repos/{owner}/{repo}/pulls/{pull_number}/comments",
			{
				owner,
				repo,
				pull_number: pullNumber,
				body,
				commit_id: commitId,
				path,
				line,
				side,
				start_line: startLine,
				start_side: startSide,
				subject_type: subjectType,
			},
		);
		return response.data;
	},
	createBranch: async (params, octokit) => {
		const { branch, fromBranch, owner, repo } = params as {
			branch: string;
			fromBranch?: string;
			owner: string;
			repo: string;
		};

		async function getDefaultBranch() {
			const { data: repoData } = await octokit.request(
				"GET /repos/{owner}/{repo}",
				{
					owner,
					repo,
				},
			);
			return repoData.default_branch;
		}

		const sourceBranch = fromBranch || (await getDefaultBranch());
		const { data: refData } = await octokit.request(
			"GET /repos/{owner}/{repo}/git/ref/heads/{branch}",
			{
				owner,
				repo,
				branch: sourceBranch,
			},
		);

		const response = await octokit.request(
			"POST /repos/{owner}/{repo}/git/refs",
			{
				owner,
				repo,
				ref: `refs/heads/${branch}`,
				sha: refData.object.sha,
			},
		);

		return response.data;
	},
	createIssue: async (params, octokit) => {
		const { assignees, body, labels, milestone, owner, repo, title } =
			params as {
				assignees?: string[];
				body?: string;
				labels?: string[];
				milestone?: number;
				owner: string;
				repo: string;
				title: string;
			};
		const response = await octokit.request(
			"POST /repos/{owner}/{repo}/issues",
			{
				owner,
				repo,
				title,
				body,
				assignees,
				labels,
				milestone,
			},
		);
		return response.data;
	},
	createOrUpdateFile: async (params, octokit) => {
		const { branch, content, message, owner, path, repo, sha } = params as {
			branch: string;
			content: string;
			message: string;
			owner: string;
			path: string;
			repo: string;
			sha?: string;
		};

		const contentBase64 = Buffer.from(content).toString("base64");

		const response = await octokit.request(
			"PUT /repos/{owner}/{repo}/contents/{path}",
			{
				owner,
				repo,
				path,
				message,
				content: contentBase64,
				branch,
				sha,
			},
		);

		return response.data;
	},
	createPullRequest: async (params, octokit) => {
		const { base, body, draft, head, maintainerCanModify, owner, repo, title } =
			params as {
				base: string;
				body?: string;
				draft?: boolean;
				head: string;
				maintainerCanModify?: boolean;
				owner: string;
				repo: string;
				title: string;
			};

		const response = await octokit.request("POST /repos/{owner}/{repo}/pulls", {
			owner,
			repo,
			title,
			body,
			head,
			base,
			draft: draft || false,
			maintainer_can_modify: maintainerCanModify,
		});

		return response.data;
	},
	createPullRequestReview: async (params, octokit) => {
		const { body, comments, commitId, event, owner, pullNumber, repo } =
			params as {
				body?: string;
				comments?: unknown[];
				commitId?: string;
				event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
				owner: string;
				pullNumber: number;
				repo: string;
			};

		const response = await octokit.request(
			"POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
			{
				owner,
				repo,
				pull_number: pullNumber,
				commit_id: commitId,
				body,
				event,
				comments,
			},
		);

		return response.data;
	},
	getCommit: async (params, octokit) => {
		const { owner, page, perPage, repo, sha } = params as {
			owner: string;
			page?: number;
			perPage?: number;
			repo: string;
			sha: string;
		};

		const response = await octokit.request(
			"GET /repos/{owner}/{repo}/commits/{ref}",
			{
				owner,
				repo,
				ref: sha,
				page,
				per_page: perPage,
			},
		);

		return response.data;
	},
	getFileContents: async (params, octokit) => {
		const { branch, owner, path, repo } = params as {
			branch?: string;
			owner: string;
			path: string;
			repo: string;
		};

		const response = await octokit.request(
			"GET /repos/{owner}/{repo}/contents/{path}",
			{
				owner,
				repo,
				path,
				ref: branch,
			},
		);

		return response.data;
	},
	getIssue: async (params, octokit) => {
		const { issueNumber, owner, repo } = params as {
			issueNumber: number;
			owner: string;
			repo: string;
		};

		const response = await octokit.request(
			"GET /repos/{owner}/{repo}/issues/{issue_number}",
			{
				owner,
				repo,
				issue_number: issueNumber,
			},
		);

		return response.data;
	},
	getIssueComments: async (params, octokit) => {
		const { issueNumber, owner, page, perPage, repo } = params as {
			issueNumber: number;
			owner: string;
			page?: number;
			perPage?: number;
			repo: string;
		};

		const response = await octokit.request(
			"GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
			{
				owner,
				repo,
				issue_number: issueNumber,
				page,
				per_page: perPage,
			},
		);

		return response.data;
	},
	getMe: async (_params, octokit) => {
		const response = await octokit.request("GET /user");
		return response.data;
	},
	getPullRequest: async (params, octokit) => {
		const { owner, pullNumber, repo } = params as {
			owner: string;
			pullNumber: number;
			repo: string;
		};

		const response = await octokit.request(
			"GET /repos/{owner}/{repo}/pulls/{pull_number}",
			{
				owner,
				repo,
				pull_number: pullNumber,
			},
		);

		return response.data;
	},
	getPullRequestComments: async (params, octokit) => {
		const { owner, pullNumber, repo } = params as {
			owner: string;
			pullNumber: number;
			repo: string;
		};

		const response = await octokit.request(
			"GET /repos/{owner}/{repo}/pulls/{pull_number}/comments",
			{
				owner,
				repo,
				pull_number: pullNumber,
			},
		);

		return response.data;
	},
	getPullRequestFiles: async (params, octokit) => {
		const { owner, pullNumber, repo } = params as {
			owner: string;
			pullNumber: number;
			repo: string;
		};

		const response = await octokit.request(
			"GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
			{
				owner,
				repo,
				pull_number: pullNumber,
			},
		);

		return response.data;
	},
	getPullRequestReviews: async (params, octokit) => {
		const { owner, pullNumber, repo } = params as {
			owner: string;
			pullNumber: number;
			repo: string;
		};

		const response = await octokit.request(
			"GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
			{
				owner,
				repo,
				pull_number: pullNumber,
			},
		);

		return response.data;
	},
	getPullRequestStatus: async (params, octokit) => {
		const { owner, pullNumber, repo } = params as {
			owner: string;
			pullNumber: number;
			repo: string;
		};

		const prResponse = await octokit.request(
			"GET /repos/{owner}/{repo}/pulls/{pull_number}",
			{
				owner,
				repo,
				pull_number: pullNumber,
			},
		);

		const sha = prResponse.data.head.sha;

		const statusResponse = await octokit.request(
			"GET /repos/{owner}/{repo}/commits/{ref}/status",
			{
				owner,
				repo,
				ref: sha,
			},
		);

		return statusResponse.data;
	},
	listBranches: async (params, octokit) => {
		const { owner, page, perPage, repo } = params as {
			owner: string;
			page?: number;
			perPage?: number;
			repo: string;
		};

		const response = await octokit.request(
			"GET /repos/{owner}/{repo}/branches",
			{
				owner,
				repo,
				page,
				per_page: perPage,
			},
		);

		return response.data;
	},
	listCommits: async (params, octokit) => {
		const { owner, page, perPage, repo, sha } = params as {
			owner: string;
			page?: number;
			perPage?: number;
			repo: string;
			sha?: string;
		};

		const response = await octokit.request(
			"GET /repos/{owner}/{repo}/commits",
			{
				owner,
				repo,
				sha,
				page,
				per_page: perPage,
			},
		);

		return response.data;
	},
	listIssues: async (params, octokit) => {
		const {
			direction,
			labels,
			owner,
			page,
			perPage,
			repo,
			since,
			sort,
			state,
		} = params as {
			direction?: "asc" | "desc";
			labels?: string[];
			owner: string;
			page?: number;
			perPage?: number;
			repo: string;
			since?: string;
			sort?: "created" | "updated" | "comments";
			state?: "open" | "closed" | "all";
		};

		const response = await octokit.request("GET /repos/{owner}/{repo}/issues", {
			owner,
			repo,
			direction,
			labels: labels?.join(","),
			page,
			per_page: perPage,
			since,
			sort,
			state,
		});

		return response.data;
	},
	listPullRequests: async (params, octokit) => {
		const { base, direction, head, owner, page, perPage, repo, sort, state } =
			params as {
				base?: string;
				direction?: "asc" | "desc";
				head?: string;
				owner: string;
				page?: number;
				perPage?: number;
				repo: string;
				sort?: "created" | "updated" | "popularity" | "long-running";
				state?: "open" | "closed" | "all";
			};

		const response = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
			owner,
			repo,
			base,
			direction,
			head,
			page,
			per_page: perPage,
			sort,
			state,
		});

		return response.data;
	},
	mergePullRequest: async (params, octokit) => {
		const { commitMessage, commitTitle, mergeMethod, owner, pullNumber, repo } =
			params as {
				commitMessage?: string;
				commitTitle?: string;
				mergeMethod?: "merge" | "squash" | "rebase";
				owner: string;
				pullNumber: number;
				repo: string;
			};

		const response = await octokit.request(
			"PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge",
			{
				owner,
				repo,
				pull_number: pullNumber,
				commit_message: commitMessage,
				commit_title: commitTitle,
				merge_method: mergeMethod,
			},
		);

		return response.data;
	},
	searchCode: async (params, octokit) => {
		const { order, page, perPage, q, sort } = params as {
			order?: "asc" | "desc";
			page?: number;
			perPage?: number;
			q: string;
			sort?: "indexed";
		};

		const response = await octokit.request("GET /search/code", {
			q,
			sort,
			order,
			page,
			per_page: perPage,
		});

		return response.data;
	},
	searchIssues: async (params, octokit) => {
		const { order, page, perPage, q, sort } = params as {
			order?: "asc" | "desc";
			page?: number;
			perPage?: number;
			q: string;
			sort?:
				| "comments"
				| "reactions"
				| "reactions-+1"
				| "reactions--1"
				| "reactions-smile"
				| "reactions-thinking_face"
				| "reactions-heart"
				| "reactions-tada"
				| "interactions"
				| "created"
				| "updated";
		};

		const response = await octokit.request("GET /search/issues", {
			q,
			sort,
			order,
			page,
			per_page: perPage,
			advanced_search: "true",
		});

		return response.data;
	},
	searchPullRequests: async (params, octokit) => {
		const { order, page, perPage, q, sort } = params as {
			order?: "asc" | "desc";
			page?: number;
			perPage?: number;
			q: string;
			sort?:
				| "comments"
				| "reactions"
				| "reactions-+1"
				| "reactions--1"
				| "reactions-smile"
				| "reactions-thinking_face"
				| "reactions-heart"
				| "reactions-tada"
				| "interactions"
				| "created"
				| "updated";
		};

		const response = await octokit.request("GET /search/issues", {
			q: `${q} type:pr`,
			sort,
			order,
			page,
			per_page: perPage,
			advanced_search: "true",
		});

		return response.data;
	},
	searchRepositories: async (params, octokit) => {
		const { page, perPage, query } = params as {
			page?: number;
			perPage?: number;
			query: string;
		};

		const response = await octokit.request("GET /search/repositories", {
			q: query,
			page,
			per_page: perPage,
		});

		return response.data;
	},
	searchUsers: async (params, octokit) => {
		const { order, page, perPage, q, sort } = params as {
			order?: "asc" | "desc";
			page?: number;
			perPage?: number;
			q: string;
			sort?: "followers" | "repositories" | "joined";
		};

		const response = await octokit.request("GET /search/users", {
			q,
			sort,
			order,
			page,
			per_page: perPage,
		});

		return response.data;
	},
	updateIssue: async (params, octokit) => {
		const {
			assignees,
			body,
			issueNumber,
			labels,
			milestone,
			owner,
			repo,
			state,
			title,
		} = params as {
			assignees?: string[];
			body?: string;
			issueNumber: number;
			labels?: string[];
			milestone?: number;
			owner: string;
			repo: string;
			state?: "open" | "closed";
			title?: string;
		};

		const response = await octokit.request(
			"PATCH /repos/{owner}/{repo}/issues/{issue_number}",
			{
				owner,
				repo,
				issue_number: issueNumber,
				title,
				body,
				assignees,
				labels,
				milestone,
				state,
			},
		);

		return response.data;
	},
	updatePullRequest: async (params, octokit) => {
		const {
			base,
			body,
			maintainerCanModify,
			owner,
			pullNumber,
			repo,
			state,
			title,
		} = params as {
			base?: string;
			body?: string;
			maintainerCanModify?: boolean;
			owner: string;
			pullNumber: number;
			repo: string;
			state?: "open" | "closed";
			title?: string;
		};

		const response = await octokit.request(
			"PATCH /repos/{owner}/{repo}/pulls/{pull_number}",
			{
				owner,
				repo,
				pull_number: pullNumber,
				title,
				body,
				state,
				base,
				maintainer_can_modify: maintainerCanModify,
			},
		);

		return response.data;
	},
	updatePullRequestBranch: async (params, octokit) => {
		const { expectedHeadSha, owner, pullNumber, repo } = params as {
			expectedHeadSha?: string;
			owner: string;
			pullNumber: number;
			repo: string;
		};

		const response = await octokit.request(
			"PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch",
			{
				owner,
				repo,
				pull_number: pullNumber,
				expected_head_sha: expectedHeadSha,
			},
		);

		return response.data;
	},
};

export function createGitHubTools(
	octokit: Octokit,
	toolDefs: readonly Tool[],
	useTools: string[],
): ToolSet {
	const toolSet: ToolSet = {};

	for (const toolDef of toolDefs) {
		if (!useTools.includes(toolDef.name)) {
			continue;
		}
		if (!hasSchema(toolDef)) {
			continue;
		}

		const executor = toolExecutors[toolDef.name];
		if (!executor) {
			continue;
		}

		toolSet[toolDef.name] = defineTool({
			description: toolDef.description,
			inputSchema: toolDef.schema,
			execute: async (params) => executor(params, octokit),
		});
	}

	return toolSet;
}
