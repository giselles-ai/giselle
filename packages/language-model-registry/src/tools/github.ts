import { defineLanguageModelTool, defineTool } from "./tool";

const tools = [
	defineTool({
		name: "addIssueComment",
		title: "Add Issue Comment",
		description: "Add a comment to an existing issue",
	}),
	defineTool({
		name: "addPullRequestReviewComment",
		title: "Add Pull Request Review Comment",
		description: "Add a review comment to a pull request",
	}),
	defineTool({
		name: "createBranch",
		title: "Create Branch",
		description: "Create a new branch in a GitHub repository",
	}),
	defineTool({
		name: "createIssue",
		title: "Create Issue",
		description: "Create a new issue in a GitHub repository",
	}),
	defineTool({
		name: "createOrUpdateFile",
		title: "Create or Update File",
		description: "Create or update a single file in a GitHub repository",
	}),
	defineTool({
		name: "createPullRequest",
		title: "Create Pull Request",
		description: "Create a new pull request in a GitHub repository",
	}),
	defineTool({
		name: "createPullRequestReview",
		title: "Create Pull Request Review",
		description: "Create a review on a pull request",
	}),
	defineTool({
		name: "getCommit",
		title: "Get Commit",
		description: "Get details for a commit from a GitHub repository",
	}),
	defineTool({
		name: "getFileContents",
		title: "Get File Contents",
		description:
			"Get the contents of a file or directory from a GitHub repository",
	}),
	defineTool({
		name: "getIssue",
		title: "Get Issue",
		description: "Get details of a specific issue in a GitHub repository",
	}),
	defineTool({
		name: "getIssueComments",
		title: "Get Issue Comments",
		description: "Get comments for a GitHub issue",
	}),
	defineTool({
		name: "getMe",
		title: "Get Me",
		description:
			'Get details of the authenticated GitHub user. Use this when a request include "me", "my"...',
	}),
	defineTool({
		name: "getPullRequest",
		title: "Get Pull Request",
		description: "Get details of a specific pull request",
	}),
	defineTool({
		name: "getPullRequestComments",
		title: "Get Pull Request Comments",
		description: "Get the review comments on a pull request",
	}),
	defineTool({
		name: "getPullRequestFiles",
		title: "Get Pull Request Files",
		description: "Get the list of files changed in a pull request",
	}),
	defineTool({
		name: "getPullRequestReviews",
		title: "Get Pull Request Reviews",
		description: "Get the reviews on a pull request",
	}),
	defineTool({
		name: "getPullRequestStatus",
		title: "Get Pull Request Status",
		description:
			"Get the combined status of all status checks for a pull request",
	}),
	defineTool({
		name: "listBranches",
		title: "List Branches",
		description: "List branches in a GitHub repository",
	}),
	defineTool({
		name: "listCommits",
		title: "List Commits",
		description: "Get list of commits of a branch in a GitHub repository",
	}),
	defineTool({
		name: "listIssues",
		title: "List Issues",
		description: "List issues in a GitHub repository with filtering options",
	}),
	defineTool({
		name: "listPullRequests",
		title: "List Pull Requests",
		description: "List and filter repository pull requests",
	}),
	defineTool({
		name: "mergePullRequest",
		title: "Merge Pull Request",
		description: "Merge a pull request",
	}),
	defineTool({
		name: "searchCode",
		title: "Search Code",
		description: "Search for code across GitHub repositories",
	}),
	defineTool({
		name: "searchIssues",
		title: "Search Issues",
		description:
			"Search for issues and pull requests across GitHub repositories",
	}),
	defineTool({
		name: "searchPullRequests",
		title: "Search Pull Requests",
		description: "Search for pull requests across GitHub repositories",
	}),
	defineTool({
		name: "searchRepositories",
		title: "Search Repositories",
		description: "Search for GitHub repositories",
	}),
	defineTool({
		name: "searchUsers",
		title: "Search Users",
		description: "Search for GitHub users",
	}),
	defineTool({
		name: "updateIssue",
		title: "Update Issue",
		description: "Update an existing issue in a GitHub repository",
	}),
	defineTool({
		name: "updatePullRequest",
		title: "Update Pull Request",
		description: "Update an existing pull request in a GitHub repository",
	}),
	defineTool({
		name: "updatePullRequestBranch",
		title: "Update Pull Request Branch",
		description:
			"Update a pull request branch with the latest changes from the base branch",
	}),
] as const;

export const githubApi = defineLanguageModelTool({
	name: "github-api",
	title: "GitHub",
	provider: "giselle",
	tools,
	configurationOptions: {
		token: {
			name: "token",
			type: "text",
			title: "Token",
		},
		useTools: {
			name: "useTools",
			type: "toolSelection",
			title: "Use Tools",
		},
	},
});
