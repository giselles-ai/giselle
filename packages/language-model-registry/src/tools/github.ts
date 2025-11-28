import * as z from "zod/v4";
import { defineLanguageModelTool, defineTool } from "./tool";

const githubTools = [
	defineTool({
		name: "addIssueComment",
		title: "Add Issue Comment",
		description: "Add a comment to an existing issue",
		schema: z.object({
			body: z.string().describe("Comment content"),
			issueNumber: z.number().describe("Issue number to comment on"),
			owner: z.string().describe("Repository owner"),
			repo: z.string().describe("Repository name"),
		}),
	}),
	defineTool({
		name: "addPullRequestReviewComment",
		title: "Add Pull Request Review Comment",
		description: "Add a review comment to a pull request",
		schema: z.object({
			body: z.string().describe("The text of the review comment"),
			commitId: z
				.string()
				.describe(
					"The SHA of the commit to comment on. Required unless in_reply_to is specified.",
				)
				.optional(),
			inReplyTo: z
				.number()
				.describe(
					"The ID of the review comment to reply to. When specified, only body is required and all other parameters are ignored",
				)
				.optional(),
			line: z
				.number()
				.describe(
					"The line of the blob in the pull request diff that the comment applies to. For multi-line comments, the last line of the range",
				)
				.optional(),
			owner: z.string().describe("Repository owner"),
			path: z
				.string()
				.describe(
					"The relative path to the file that necessitates a comment. Required unless in_reply_to is specified.",
				)
				.optional(),
			pullNumber: z.number().describe("Pull request number"),
			repo: z.string().describe("Repository name"),
			side: z.enum(["LEFT", "RIGHT"]).optional(),
			startLine: z
				.number()
				.describe(
					"For multi-line comments, the first line of the range that the comment applies to",
				)
				.optional(),
			startSide: z.enum(["LEFT", "RIGHT"]).optional(),
			subjectType: z.enum(["line", "file"]).optional(),
		}),
	}),
	defineTool({
		name: "createBranch",
		title: "Create Branch",
		description: "Create a new branch in a GitHub repository",
		schema: z.object({
			branch: z.string().describe("Name for new branch"),
			fromBranch: z
				.string()
				.describe("Source branch (defaults to repo default)")
				.optional(),
			owner: z.string().describe("Repository owner"),
			repo: z.string().describe("Repository name"),
		}),
	}),
	defineTool({
		name: "createIssue",
		title: "Create Issue",
		description: "Create a new issue in a GitHub repository",
		schema: z.object({
			assignees: z
				.array(z.string())
				.describe("Usernames to assign to this issue")
				.optional(),
			body: z.string().describe("Issue body content").optional(),
			labels: z
				.array(z.string())
				.describe("Labels to apply to this issue")
				.optional(),
			milestone: z.number().describe("Milestone number").optional(),
			owner: z.string().describe("Repository owner"),
			repo: z.string().describe("Repository name"),
			title: z.string().describe("Issue title"),
		}),
	}),
	defineTool({
		name: "createOrUpdateFile",
		title: "Create or Update File",
		description: "Create or update a single file in a GitHub repository",
		schema: z.object({
			branch: z.string().describe("Branch to create/update the file in"),
			content: z.string().describe("Content of the file"),
			message: z.string().describe("Commit message"),
			owner: z.string().describe("Repository owner (username or organization)"),
			path: z.string().describe("Path where to create/update the file"),
			repo: z.string().describe("Repository name"),
			sha: z
				.string()
				.describe("SHA of file being replaced (for updates)")
				.optional(),
		}),
	}),
	defineTool({
		name: "createPullRequest",
		title: "Create Pull Request",
		description: "Create a new pull request in a GitHub repository",
		schema: z.object({
			base: z.string().describe("Branch to merge into"),
			body: z.string().describe("PR description").optional(),
			draft: z.boolean().describe("Create as draft PR").optional(),
			head: z.string().describe("Branch containing changes"),
			maintainerCanModify: z
				.boolean()
				.describe("Allow maintainer edits")
				.optional(),
			owner: z.string().describe("Repository owner"),
			repo: z.string().describe("Repository name"),
			title: z.string().describe("PR title"),
		}),
	}),
	defineTool({
		name: "createPullRequestReview",
		title: "Create Pull Request Review",
		description: "Create a review on a pull request",
		schema: z.object({
			body: z.string().describe("Review comment text").optional(),
			comments: z
				.array(z.any())
				.describe(
					"Line-specific comments array of objects to place comments on pull request changes. Requires path and body. For line comments use line or position. For multi-line comments use start_line and line with optional side parameters.",
				)
				.optional(),
			commitId: z.string().describe("SHA of commit to review").optional(),
			event: z
				.enum(["APPROVE", "REQUEST_CHANGES", "COMMENT"])
				.describe("Review action ('APPROVE', 'REQUEST_CHANGES', 'COMMENT')"),
			owner: z.string().describe("Repository owner"),
			pullNumber: z.number().describe("Pull request number"),
			repo: z.string().describe("Repository name"),
		}),
	}),
	defineTool({
		name: "getCommit",
		title: "Get Commit",
		description: "Get details for a commit from a GitHub repository",
		schema: z.object({
			owner: z.string().describe("Repository owner"),
			page: z
				.number()
				.describe("Page number for pagination (min 1)")
				.min(1)
				.optional(),
			perPage: z
				.number()
				.describe("Results per page for pagination (min 1, max 100)")
				.min(1)
				.max(100)
				.optional(),
			repo: z.string().describe("Repository name"),
			sha: z.string().describe("Commit SHA, branch name, or tag name"),
		}),
	}),
	defineTool({
		name: "getFileContents",
		title: "Get File Contents",
		description:
			"Get the contents of a file or directory from a GitHub repository",
		schema: z.object({
			branch: z.string().describe("Branch to get contents from").optional(),
			owner: z.string().describe("Repository owner (username or organization)"),
			path: z.string().describe("Path to file/directory"),
			repo: z.string().describe("Repository name"),
		}),
	}),
	defineTool({
		name: "getIssue",
		title: "Get Issue",
		description: "Get details of a specific issue in a GitHub repository",
		schema: z.object({
			issueNumber: z.number().describe("The number of the issue"),
			owner: z.string().describe("The owner of the repository"),
			repo: z.string().describe("The name of the repository"),
		}),
	}),
	defineTool({
		name: "getIssueComments",
		title: "Get Issue Comments",
		description: "Get comments for a GitHub issue",
		schema: z.object({
			issueNumber: z.number().describe("Issue number"),
			owner: z.string().describe("Repository owner"),
			page: z.number().describe("Page number").optional(),
			perPage: z.number().describe("Number of records per page").optional(),
			repo: z.string().describe("Repository name"),
		}),
	}),
	defineTool({
		name: "getMe",
		title: "Get Me",
		description:
			'Get details of the authenticated GitHub user. Use this when a request include "me", "my"...',
		schema: z.object({
			reason: z
				.string()
				.describe("Optional: reason the session was created")
				.optional(),
		}),
	}),
	defineTool({
		name: "getPullRequest",
		title: "Get Pull Request",
		description: "Get details of a specific pull request",
		schema: z.object({
			owner: z.string().describe("Repository owner"),
			pullNumber: z.number().describe("Pull request number"),
			repo: z.string().describe("Repository name"),
		}),
	}),
	defineTool({
		name: "getPullRequestComments",
		title: "Get Pull Request Comments",
		description: "Get the review comments on a pull request",
		schema: z.object({
			owner: z.string().describe("Repository owner"),
			pullNumber: z.number().describe("Pull request number"),
			repo: z.string().describe("Repository name"),
		}),
	}),
	defineTool({
		name: "getPullRequestFiles",
		title: "Get Pull Request Files",
		description: "Get the list of files changed in a pull request",
		schema: z.object({
			owner: z.string().describe("Repository owner"),
			pullNumber: z.number().describe("Pull request number"),
			repo: z.string().describe("Repository name"),
		}),
	}),
	defineTool({
		name: "getPullRequestReviews",
		title: "Get Pull Request Reviews",
		description: "Get the reviews on a pull request",
		schema: z.object({
			owner: z.string().describe("Repository owner"),
			pullNumber: z.number().describe("Pull request number"),
			repo: z.string().describe("Repository name"),
		}),
	}),
	defineTool({
		name: "getPullRequestStatus",
		title: "Get Pull Request Status",
		description:
			"Get the combined status of all status checks for a pull request",
		schema: z.object({
			owner: z.string().describe("Repository owner"),
			pullNumber: z.number().describe("Pull request number"),
			repo: z.string().describe("Repository name"),
		}),
	}),
	defineTool({
		name: "listBranches",
		title: "List Branches",
		description: "List branches in a GitHub repository",
		schema: z.object({
			owner: z.string().describe("Repository owner"),
			page: z
				.number()
				.describe("Page number for pagination (min 1)")
				.min(1)
				.optional(),
			perPage: z
				.number()
				.describe("Results per page for pagination (min 1, max 100)")
				.min(1)
				.max(100)
				.optional(),
			repo: z.string().describe("Repository name"),
		}),
	}),
	defineTool({
		name: "listCommits",
		title: "List Commits",
		description: "Get list of commits of a branch in a GitHub repository",
		schema: z.object({
			owner: z.string().describe("Repository owner"),
			page: z
				.number()
				.describe("Page number for pagination (min 1)")
				.min(1)
				.optional(),
			perPage: z
				.number()
				.describe("Results per page for pagination (min 1, max 100)")
				.min(1)
				.max(100)
				.optional(),
			repo: z.string().describe("Repository name"),
			sha: z.string().describe("SHA or Branch name").optional(),
		}),
	}),
	defineTool({
		name: "listIssues",
		title: "List Issues",
		description: "List issues in a GitHub repository with filtering options",
		schema: z.object({
			direction: z.enum(["asc", "desc"]).optional(),
			labels: z.array(z.string()).describe("Filter by labels").optional(),
			owner: z.string().describe("Repository owner"),
			page: z
				.number()
				.describe("Page number for pagination (min 1)")
				.min(1)
				.optional(),
			perPage: z
				.number()
				.describe("Results per page for pagination (min 1, max 100)")
				.min(1)
				.max(100)
				.optional(),
			repo: z.string().describe("Repository name"),
			since: z
				.string()
				.describe("Filter by date (ISO 8601 timestamp)")
				.optional(),
			sort: z.enum(["created", "updated", "comments"]).optional(),
			state: z.enum(["open", "closed", "all"]).optional(),
		}),
	}),
	defineTool({
		name: "listPullRequests",
		title: "List Pull Requests",
		description: "List and filter repository pull requests",
		schema: z.object({
			base: z.string().describe("Filter by base branch").optional(),
			direction: z.enum(["asc", "desc"]).optional(),
			head: z
				.string()
				.describe("Filter by head user/org and branch")
				.optional(),
			owner: z.string().describe("Repository owner"),
			page: z
				.number()
				.describe("Page number for pagination (min 1)")
				.min(1)
				.optional(),
			perPage: z
				.number()
				.describe("Results per page for pagination (min 1, max 100)")
				.min(1)
				.max(100)
				.optional(),
			repo: z.string().describe("Repository name"),
			sort: z
				.enum(["created", "updated", "popularity", "long-running"])
				.optional(),
			state: z.enum(["open", "closed", "all"]).optional(),
		}),
	}),
	defineTool({
		name: "mergePullRequest",
		title: "Merge Pull Request",
		description: "Merge a pull request",
		schema: z.object({
			commitMessage: z
				.string()
				.describe("Extra detail for merge commit")
				.optional(),
			commitTitle: z.string().describe("Title for merge commit").optional(),
			mergeMethod: z.enum(["merge", "squash", "rebase"]).optional(),
			owner: z.string().describe("Repository owner"),
			pullNumber: z.number().describe("Pull request number"),
			repo: z.string().describe("Repository name"),
		}),
	}),
	defineTool({
		name: "searchCode",
		title: "Search Code",
		description: "Search for code across GitHub repositories",
		schema: z.object({
			order: z.enum(["asc", "desc"]).optional(),
			page: z
				.number()
				.describe("Page number for pagination (min 1)")
				.min(1)
				.optional(),
			perPage: z
				.number()
				.describe("Results per page for pagination (min 1, max 100)")
				.min(1)
				.max(100)
				.optional(),
			q: z.string().describe("Search query using GitHub code search syntax"),
			sort: z
				.enum(["indexed"])
				.describe("Sort field ('indexed' only)")
				.optional(),
		}),
	}),
	defineTool({
		name: "searchIssues",
		title: "Search Issues",
		description:
			"Search for issues and pull requests across GitHub repositories",
		schema: z.object({
			order: z.enum(["asc", "desc"]).optional(),
			page: z
				.number()
				.describe("Page number for pagination (min 1)")
				.min(1)
				.optional(),
			perPage: z
				.number()
				.describe("Results per page for pagination (min 1, max 100)")
				.min(1)
				.max(100)
				.optional(),
			q: z.string().describe("Search query using GitHub issues search syntax"),
			sort: z
				.enum([
					"comments",
					"reactions",
					"reactions-+1",
					"reactions--1",
					"reactions-smile",
					"reactions-thinking_face",
					"reactions-heart",
					"reactions-tada",
					"interactions",
					"created",
					"updated",
				])
				.optional(),
		}),
	}),
	defineTool({
		name: "searchPullRequests",
		title: "Search Pull Requests",
		description: "Search for pull requests across GitHub repositories",
		schema: z.object({
			order: z.enum(["asc", "desc"]).optional(),
			page: z
				.number()
				.describe("Page number for pagination (min 1)")
				.min(1)
				.optional(),
			perPage: z
				.number()
				.describe("Results per page for pagination (min 1, max 100)")
				.min(1)
				.max(100)
				.optional(),
			q: z.string().describe("Search query using GitHub issues search syntax"),
			sort: z
				.enum([
					"comments",
					"reactions",
					"reactions-+1",
					"reactions--1",
					"reactions-smile",
					"reactions-thinking_face",
					"reactions-heart",
					"reactions-tada",
					"interactions",
					"created",
					"updated",
				])
				.optional(),
		}),
	}),
	defineTool({
		name: "searchRepositories",
		title: "Search Repositories",
		description: "Search for GitHub repositories",
		schema: z.object({
			page: z
				.number()
				.describe("Page number for pagination (min 1)")
				.min(1)
				.optional(),
			perPage: z
				.number()
				.describe("Results per page for pagination (min 1, max 100)")
				.min(1)
				.max(100)
				.optional(),
			query: z.string().describe("Search query"),
		}),
	}),
	defineTool({
		name: "searchUsers",
		title: "Search Users",
		description: "Search for GitHub users",
		schema: z.object({
			order: z.enum(["asc", "desc"]).optional(),
			page: z
				.number()
				.describe("Page number for pagination (min 1)")
				.min(1)
				.optional(),
			perPage: z
				.number()
				.describe("Results per page for pagination (min 1, max 100)")
				.min(1)
				.max(100)
				.optional(),
			q: z.string().describe("Search query using GitHub users search syntax"),
			sort: z.enum(["followers", "repositories", "joined"]).optional(),
		}),
	}),
	defineTool({
		name: "updateIssue",
		title: "Update Issue",
		description: "Update an existing issue in a GitHub repository",
		schema: z.object({
			assignees: z.array(z.string()).describe("New assignees").optional(),
			body: z.string().describe("New description").optional(),
			issueNumber: z.number().describe("Issue number to update"),
			labels: z.array(z.string()).describe("New labels").optional(),
			milestone: z.number().describe("New milestone number").optional(),
			owner: z.string().describe("Repository owner"),
			repo: z.string().describe("Repository name"),
			state: z.enum(["open", "closed"]).optional(),
			title: z.string().describe("New title").optional(),
		}),
	}),
	defineTool({
		name: "updatePullRequest",
		title: "Update Pull Request",
		description: "Update an existing pull request in a GitHub repository",
		schema: z.object({
			base: z.string().describe("New base branch name").optional(),
			body: z.string().describe("New description").optional(),
			maintainerCanModify: z
				.boolean()
				.describe("Allow maintainer edits")
				.optional(),
			owner: z.string().describe("Repository owner"),
			pullNumber: z.number().describe("Pull request number to update"),
			repo: z.string().describe("Repository name"),
			state: z.enum(["open", "closed"]).optional(),
			title: z.string().describe("New title").optional(),
		}),
	}),
	defineTool({
		name: "updatePullRequestBranch",
		title: "Update Pull Request Branch",
		description:
			"Update a pull request branch with the latest changes from the base branch",
		schema: z.object({
			expectedHeadSha: z
				.string()
				.describe("The expected SHA of the pull request's HEAD ref")
				.optional(),
			owner: z.string().describe("Repository owner"),
			pullNumber: z.number().describe("Pull request number"),
			repo: z.string().describe("Repository name"),
		}),
	}),
] as const;

export type GitHubTool = (typeof githubTools)[number];
const githubToolNames = githubTools.map((tool) => tool.name);
type GitHubToolName = (typeof githubToolNames)[number];

export const githubApi = defineLanguageModelTool({
	name: "github-api",
	title: "GitHub",
	provider: "giselle",
	tools: githubTools,
	configurationOptions: {
		secretId: {
			name: "secretId",
			type: "secret",
			title: "Token",
			description:
				"GitHub token formats: Classic PAT (ghp_ followed by 36 alphanumeric characters), Fine-grained PAT (github_pat_ followed by 82 alphanumeric characters), or OAuth token (gho_ followed by 36 alphanumeric characters).",
			secretTags: ["github-access-token"],
		},
		useTools: {
			name: "useTools",
			type: "toolSelection",
			title: "Use Tools",
		},
	},
});

export function isGitHubToolName(v: unknown): v is GitHubToolName {
	return (
		typeof v === "string" && githubToolNames.some((toolName) => toolName === v)
	);
}
