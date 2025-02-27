import type { Octokit } from "@octokit/core";
import { z } from "zod";
import { defineTool } from "../tool-registry.js";

// Get file contents tool
export const getFileContentsTool = defineTool({
	name: "get_file_contents",
	description:
		"Gets the contents of a file or directory from a GitHub repository",
	purpose: "Retrieve file or directory contents from a GitHub repository",
	inputSchema: z.object({
		tool: z.literal("get_file_contents"),
		owner: z.string().describe("Repository owner"),
		repo: z.string().describe("Repository name"),
		path: z.string().describe("Path to the file or directory"),
		branch: z
			.string()
			.optional()
			.describe("Branch name (defaults to repository's default branch)"),
	}),
	execute: async (octokit: Octokit, input) => {
		const result = await octokit.request(
			"GET /repos/{owner}/{repo}/contents/{path}",
			{
				owner: input.owner,
				repo: input.repo,
				path: input.path,
				ref: input.branch,
			},
		);
		return result.data;
	},
	examples: [
		{
			input: {
				tool: "get_file_contents",
				owner: "octocat",
				repo: "Hello-World",
				path: "README.md",
			},
			output: {
				type: "file",
				encoding: "base64",
				size: 5362,
				name: "README.md",
				path: "README.md",
				content: "IyBIZWxsby1Xb3JsZAoKVGhpcyBpcyBhIHNhbXBsZSByZXBvc2l0b3J5...", // base64 encoded content
				sha: "3d21ec53a331a6f037a91c368710b99387d012c1",
				url: "https://api.github.com/repos/octocat/Hello-World/contents/README.md",
				git_url:
					"https://api.github.com/repos/octocat/Hello-World/git/blobs/3d21ec53a331a6f037a91c368710b99387d012c1",
				html_url: "https://github.com/octocat/Hello-World/blob/main/README.md",
				download_url:
					"https://raw.githubusercontent.com/octocat/Hello-World/main/README.md",
				_links: {
					self: "https://api.github.com/repos/octocat/Hello-World/contents/README.md",
					git: "https://api.github.com/repos/octocat/Hello-World/git/blobs/3d21ec53a331a6f037a91c368710b99387d012c1",
					html: "https://github.com/octocat/Hello-World/blob/main/README.md",
				},
			},
			description: "Get contents of README.md file from repository root",
		},
		{
			input: {
				tool: "get_file_contents",
				owner: "octocat",
				repo: "Hello-World",
				path: "src",
				branch: "development",
			},
			output: [
				{
					type: "dir",
					size: 0,
					name: "lib",
					path: "src/lib",
					sha: "7fb539a8e8f489c1e9fb4a0b8a046e6e150b1c22",
					url: "https://api.github.com/repos/octocat/Hello-World/contents/src/lib?ref=development",
					git_url:
						"https://api.github.com/repos/octocat/Hello-World/git/trees/7fb539a8e8f489c1e9fb4a0b8a046e6e150b1c22",
					html_url:
						"https://github.com/octocat/Hello-World/tree/development/src/lib",
					download_url: null,
					_links: {
						self: "https://api.github.com/repos/octocat/Hello-World/contents/src/lib?ref=development",
						git: "https://api.github.com/repos/octocat/Hello-World/git/trees/7fb539a8e8f489c1e9fb4a0b8a046e6e150b1c22",
						html: "https://github.com/octocat/Hello-World/tree/development/src/lib",
					},
				},
			],
			description: "List contents of src directory from development branch",
		},
	],
	constraints: [
		"Files between 1-100 MB only support raw or object media types",
		"Files over 100 MB are not supported",
		"Binary files are base64 encoded",
		"Symlinks are dereferenced",
		"Directory listings are returned as arrays and limited to 1000 files",
		"Private repositories require authentication",
		"Download URLs for private repositories expire after 5 minutes",
		"Create/update and delete operations must be executed serially to avoid conflicts",
	],
});

// Get issue tool
export const getIssueTool = defineTool({
	name: "get_issue",
	description: "Gets details of a specific issue in a GitHub repository",
	purpose: "Retrieve detailed information about a specific issue",
	inputSchema: z.object({
		tool: z.literal("get_issue"),
		owner: z.string().describe("Repository owner"),
		repo: z.string().describe("Repository name"),
		issue_number: z.number().describe("Issue number"),
	}),
	execute: async (octokit: Octokit, input) => {
		const result = await octokit.request(
			"GET /repos/{owner}/{repo}/issues/{issue_number}",
			{
				owner: input.owner,
				repo: input.repo,
				issue_number: input.issue_number,
			},
		);
		return result.data;
	},
	examples: [
		{
			input: {
				tool: "get_issue",
				owner: "octocat",
				repo: "Hello-World",
				issue_number: 1,
			},
			output: {
				id: 1,
				node_id: "MDU6SXNzdWUx",
				url: "https://api.github.com/repos/octocat/Hello-World/issues/1",
				repository_url: "https://api.github.com/repos/octocat/Hello-World",
				labels_url:
					"https://api.github.com/repos/octocat/Hello-World/issues/1/labels{/name}",
				comments_url:
					"https://api.github.com/repos/octocat/Hello-World/issues/1/comments",
				events_url:
					"https://api.github.com/repos/octocat/Hello-World/issues/1/events",
				html_url: "https://github.com/octocat/Hello-World/issues/1",
				number: 1,
				title: "Found a bug",
				state: "open",
				locked: false,
				body: "I'm having a problem with this.",
				author_association: "OWNER",
				user: {
					login: "octocat",
					id: 1,
					node_id: "MDQ6VXNlcjE=",
					avatar_url: "https://github.com/images/error/octocat_happy.gif",
					gravatar_id: "",
					url: "https://api.github.com/users/octocat",
					html_url: "https://github.com/octocat",
					followers_url: "https://api.github.com/users/octocat/followers",
					following_url:
						"https://api.github.com/users/octocat/following{/other_user}",
					gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
					starred_url:
						"https://api.github.com/users/octocat/starred{/owner}{/repo}",
					subscriptions_url:
						"https://api.github.com/users/octocat/subscriptions",
					organizations_url: "https://api.github.com/users/octocat/orgs",
					repos_url: "https://api.github.com/users/octocat/repos",
					events_url: "https://api.github.com/users/octocat/events{/privacy}",
					received_events_url:
						"https://api.github.com/users/octocat/received_events",
					type: "User",
					site_admin: false,
				},
				labels: [
					{
						id: 1,
						name: "bug",
						description: "Something isn't working",
						color: "f29513",
					},
				],
				assignee: null,
				assignees: [],
				milestone: null,
				comments: 0,
				created_at: "2011-04-10T20:09:31Z",
				updated_at: "2011-04-10T20:09:31Z",
				closed_at: null,
			},
			description: "Get details of an open bug issue",
		},
	],
	constraints: [
		"Issue numbers are repository-specific",
		"Returns both issues and pull requests",
		"Requires read access to the repository",
		"Returns 404 if issue number doesn't exist",
		"Body supports markdown format",
	],
});

// List issues tool
export const listIssuesTool = defineTool({
	name: "list_issues",
	description: "Lists issues in a GitHub repository with filtering options",
	purpose: "Retrieve a list of issues from a repository with optional filters",
	inputSchema: z.object({
		tool: z.literal("list_issues"),
		owner: z.string().describe("Repository owner"),
		repo: z.string().describe("Repository name"),
		state: z.enum(["open", "closed", "all"]).optional().describe("Issue state"),
		labels: z.array(z.string()).optional().describe("List of label names"),
		assignee: z.string().optional().describe("GitHub username of assignee"),
		creator: z.string().optional().describe("GitHub username of issue creator"),
		mentioned: z
			.string()
			.optional()
			.describe("GitHub username mentioned in issues"),
		since: z
			.string()
			.optional()
			.describe("ISO 8601 timestamp to filter by updated date"),
		page: z.number().optional().describe("Page number of results"),
		per_page: z
			.number()
			.min(1)
			.max(100)
			.optional()
			.describe("Number of results per page"),
	}),
	execute: async (octokit: Octokit, input) => {
		const result = await octokit.request("GET /repos/{owner}/{repo}/issues", {
			owner: input.owner,
			repo: input.repo,
			state: input.state,
			labels: input.labels?.join(","),
			assignee: input.assignee,
			creator: input.creator,
			mentioned: input.mentioned,
			since: input.since,
			page: input.page,
			per_page: input.per_page,
		});
		return result.data;
	},
	examples: [
		{
			input: {
				tool: "list_issues",
				owner: "octocat",
				repo: "Hello-World",
				state: "open",
				labels: ["bug"],
				assignee: "octocat",
				since: "2020-01-01T00:00:00Z",
			},
			output: [
				{
					id: 1,
					node_id: "MDU6SXNzdWUx",
					url: "https://api.github.com/repos/octocat/Hello-World/issues/1",
					repository_url: "https://api.github.com/repos/octocat/Hello-World",
					labels_url:
						"https://api.github.com/repos/octocat/Hello-World/issues/1/labels{/name}",
					comments_url:
						"https://api.github.com/repos/octocat/Hello-World/issues/1/comments",
					events_url:
						"https://api.github.com/repos/octocat/Hello-World/issues/1/events",
					html_url: "https://github.com/octocat/Hello-World/issues/1",
					number: 1,
					title: "Found a bug",
					state: "open",
					locked: false,
					body: "I'm having a problem with this.",
					author_association: "OWNER",
					user: {
						login: "octocat",
						id: 1,
						node_id: "MDQ6VXNlcjE=",
						avatar_url: "https://github.com/images/error/octocat_happy.gif",
						gravatar_id: "",
						url: "https://api.github.com/users/octocat",
						html_url: "https://github.com/octocat",
						followers_url: "https://api.github.com/users/octocat/followers",
						following_url:
							"https://api.github.com/users/octocat/following{/other_user}",
						gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
						starred_url:
							"https://api.github.com/users/octocat/starred{/owner}{/repo}",
						subscriptions_url:
							"https://api.github.com/users/octocat/subscriptions",
						organizations_url: "https://api.github.com/users/octocat/orgs",
						repos_url: "https://api.github.com/users/octocat/repos",
						events_url: "https://api.github.com/users/octocat/events{/privacy}",
						received_events_url:
							"https://api.github.com/users/octocat/received_events",
						type: "User",
						site_admin: false,
					},
					labels: [
						{
							id: 1,
							name: "bug",
							description: "Something isn't working",
							color: "f29513",
						},
					],
					assignee: {
						login: "octocat",
						id: 1,
						node_id: "MDQ6VXNlcjE=",
						avatar_url: "https://github.com/images/error/octocat_happy.gif",
						gravatar_id: "",
						url: "https://api.github.com/users/octocat",
						html_url: "https://github.com/octocat",
						followers_url: "https://api.github.com/users/octocat/followers",
						following_url:
							"https://api.github.com/users/octocat/following{/other_user}",
						gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
						starred_url:
							"https://api.github.com/users/octocat/starred{/owner}{/repo}",
						subscriptions_url:
							"https://api.github.com/users/octocat/subscriptions",
						organizations_url: "https://api.github.com/users/octocat/orgs",
						repos_url: "https://api.github.com/users/octocat/repos",
						events_url: "https://api.github.com/users/octocat/events{/privacy}",
						received_events_url:
							"https://api.github.com/users/octocat/received_events",
						type: "User",
						site_admin: false,
					},
					assignees: [
						{
							login: "octocat",
							id: 1,
							node_id: "MDQ6VXNlcjE=",
							avatar_url: "https://github.com/images/error/octocat_happy.gif",
							gravatar_id: "",
							url: "https://api.github.com/users/octocat",
							html_url: "https://github.com/octocat",
							followers_url: "https://api.github.com/users/octocat/followers",
							following_url:
								"https://api.github.com/users/octocat/following{/other_user}",
							gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
							starred_url:
								"https://api.github.com/users/octocat/starred{/owner}{/repo}",
							subscriptions_url:
								"https://api.github.com/users/octocat/subscriptions",
							organizations_url: "https://api.github.com/users/octocat/orgs",
							repos_url: "https://api.github.com/users/octocat/repos",
							events_url:
								"https://api.github.com/users/octocat/events{/privacy}",
							received_events_url:
								"https://api.github.com/users/octocat/received_events",
							type: "User",
							site_admin: false,
						},
					],
					milestone: null,
					comments: 0,
					created_at: "2020-01-15T10:30:00Z",
					updated_at: "2020-01-16T14:20:00Z",
					closed_at: null,
				},
			],
			description: "List open bug issues assigned to octocat",
		},
	],
	constraints: [
		"Default state is 'open'",
		"Multiple labels are combined with AND logic",
		"Returns both issues and pull requests by default",
		"Maximum of 100 results per page",
		"Results are sorted by created date in descending order",
		"Since parameter filters by updated date",
		"Requires read access to the repository",
	],
});

// List commits tool
export const listCommitsTool = defineTool({
	name: "list_commits",
	description: "Gets list of commits of a branch in a GitHub repository",
	purpose: "Retrieve commit history of a repository branch",
	inputSchema: z.object({
		tool: z.literal("list_commits"),
		owner: z.string().describe("Repository owner"),
		repo: z.string().describe("Repository name"),
		sha: z
			.string()
			.optional()
			.describe("SHA or branch name to start listing commits from"),
		path: z
			.string()
			.optional()
			.describe("Only commits containing this file path will be returned"),
		author: z
			.string()
			.optional()
			.describe("GitHub username, name, or email of author"),
		since: z
			.string()
			.optional()
			.describe(
				"ISO 8601 timestamp - only commits after this date will be returned",
			),
		until: z
			.string()
			.optional()
			.describe(
				"ISO 8601 timestamp - only commits before this date will be returned",
			),
		page: z.number().optional().describe("Page number of results"),
		per_page: z
			.number()
			.min(1)
			.max(100)
			.optional()
			.describe("Number of results per page"),
	}),
	execute: async (octokit: Octokit, input) => {
		const result = await octokit.request("GET /repos/{owner}/{repo}/commits", {
			owner: input.owner,
			repo: input.repo,
			sha: input.sha,
			path: input.path,
			author: input.author,
			since: input.since,
			until: input.until,
			page: input.page,
			per_page: input.per_page,
		});
		return result.data;
	},
	examples: [
		{
			input: {
				tool: "list_commits",
				owner: "octocat",
				repo: "Hello-World",
				sha: "main",
				path: "README.md",
				author: "octocat",
				since: "2020-01-01T00:00:00Z",
				until: "2020-12-31T23:59:59Z",
			},
			output: [
				{
					sha: "6dcb09b5b57875f334f61aebed695e2e4193db5e",
					node_id:
						"MDY6Q29tbWl0NmRjYjA5YjViNTc4NzVmMzM0ZjYxYWViZWQ2OTVlMmU0MTkzZGI1ZQ==",
					commit: {
						author: {
							name: "The Octocat",
							email: "octocat@github.com",
							date: "2020-06-15T13:33:48Z",
						},
						committer: {
							name: "GitHub",
							email: "noreply@github.com",
							date: "2020-06-15T13:33:48Z",
						},
						message: "Fix README formatting",
						tree: {
							sha: "6dcb09b5b57875f334f61aebed695e2e4193db5e",
							url: "https://api.github.com/repos/octocat/Hello-World/git/trees/6dcb09b5b57875f334f61aebed695e2e4193db5e",
						},
						url: "https://api.github.com/repos/octocat/Hello-World/git/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e",
						comment_count: 0,
						verification: {
							verified: true,
							reason: "valid",
							signature:
								"-----BEGIN PGP SIGNATURE-----\n...\n-----END PGP SIGNATURE-----\n",
							payload: "tree 6dcb09b5b57875f334f61aebed695e2e4193db5e\n...",
						},
					},
					url: "https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e",
					html_url:
						"https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e",
					comments_url:
						"https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e/comments",
					author: {
						login: "octocat",
						id: 1,
						node_id: "MDQ6VXNlcjE=",
						avatar_url: "https://github.com/images/error/octocat_happy.gif",
						gravatar_id: "",
						url: "https://api.github.com/users/octocat",
						html_url: "https://github.com/octocat",
						followers_url: "https://api.github.com/users/octocat/followers",
						following_url:
							"https://api.github.com/users/octocat/following{/other_user}",
						gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
						starred_url:
							"https://api.github.com/users/octocat/starred{/owner}{/repo}",
						subscriptions_url:
							"https://api.github.com/users/octocat/subscriptions",
						organizations_url: "https://api.github.com/users/octocat/orgs",
						repos_url: "https://api.github.com/users/octocat/repos",
						events_url: "https://api.github.com/users/octocat/events{/privacy}",
						received_events_url:
							"https://api.github.com/users/octocat/received_events",
						type: "User",
						site_admin: false,
					},
					committer: {
						login: "web-flow",
						id: 19864447,
						node_id: "MDQ6VXNlcjE5ODY0NDQ3",
						avatar_url: "https://avatars.githubusercontent.com/u/19864447?v=4",
						gravatar_id: "",
						url: "https://api.github.com/users/web-flow",
						html_url: "https://github.com/web-flow",
						followers_url: "https://api.github.com/users/web-flow/followers",
						following_url:
							"https://api.github.com/users/web-flow/following{/other_user}",
						gists_url: "https://api.github.com/users/web-flow/gists{/gist_id}",
						starred_url:
							"https://api.github.com/users/web-flow/starred{/owner}{/repo}",
						subscriptions_url:
							"https://api.github.com/users/web-flow/subscriptions",
						organizations_url: "https://api.github.com/users/web-flow/orgs",
						repos_url: "https://api.github.com/users/web-flow/repos",
						events_url:
							"https://api.github.com/users/web-flow/events{/privacy}",
						received_events_url:
							"https://api.github.com/users/web-flow/received_events",
						type: "User",
						site_admin: false,
					},
					parents: [
						{
							sha: "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d",
							url: "https://api.github.com/repos/octocat/Hello-World/commits/7fd1a60b01f91b314f59955a4e4d4e80d8edf11d",
							html_url:
								"https://github.com/octocat/Hello-World/commit/7fd1a60b01f91b314f59955a4e4d4e80d8edf11d",
						},
					],
				},
			],
			description: "List commits to README.md by octocat in 2020",
		},
	],
	constraints: [
		"SHA can be branch name, tag name, or commit SHA",
		"Path filters commits affecting specific file/directory",
		"Author can be GitHub username, name, or email",
		"Date filters use ISO 8601 format",
		"Maximum of 100 results per page",
		"Results are sorted by commit date in descending order",
		"Requires read access to the repository",
		"Dereferences git tags",
	],
});

// Get pull request diff tool
export const getPullRequestDiffTool = defineTool({
	name: "get_pull_request_diff",
	description: "Gets the diff content of a specific pull request",
	purpose:
		"Retrieve the changes (diff) made in a pull request in unified diff format",
	inputSchema: z.object({
		tool: z.literal("get_pull_request_diff"),
		owner: z.string().describe("Repository owner"),
		repo: z.string().describe("Repository name"),
		pull_number: z.number().describe("Pull request number"),
	}),
	execute: async (octokit: Octokit, input) => {
		const result = await octokit.request(
			"GET /repos/{owner}/{repo}/pulls/{pull_number}",
			{
				owner: input.owner,
				repo: input.repo,
				pull_number: input.pull_number,
				headers: {
					accept: "application/vnd.github.v3.diff",
				},
			},
		);
		// https://github.com/octokit/request.js/issues/463#issuecomment-1164800010
		return result.data as unknown as string;
	},
	examples: [
		{
			input: {
				tool: "get_pull_request_diff",
				owner: "octocat",
				repo: "Hello-World",
				pull_number: 1,
			},
			output:
				"diff --git a/README.md b/README.md\nindex 1234567..89abcde 100644\n--- a/README.md\n+++ b/README.md\n@@ -1,3 +1,4 @@\n # Hello-World\n-A simple test repository\n+A simple example repository\n+More details about this project\n",
			description: "Get the diff of a pull request that updates README.md",
		},
	],
	constraints: [
		"Returns diff in unified diff format",
		"Shows file additions, deletions, and modifications",
		"Includes context lines around changes",
		"Shows file mode changes and renames",
		"Requires read access to the repository",
		"Returns 404 if pull request number doesn't exist",
		"Can handle large diffs",
		"Response includes both metadata and diff content",
		"Diff shows line-by-line changes with + and - markers",
		"Headers indicate binary file changes when applicable",
	],
});
