import type { AvailableTool } from "./tool-registry.js";
import { graphqlTool } from "./tools/graphql.js";
import {
	getFileContentsTool,
	getIssueTool,
	getPullRequestCommentsTool,
	getPullRequestDiffTool,
	getPullRequestFilesTool,
	getPullRequestReviewsTool,
	getPullRequestStatusTool,
	getPullRequestTool,
	listCommitsTool,
	listIssuesTool,
	listPullRequestsTool,
} from "./tools/read.js";
import { restTool } from "./tools/rest.js";
import {
	searchCodeTool,
	searchIssuesTool,
	searchRepositoriesTool,
	searchUsersTool,
} from "./tools/search.js";

// Tool group type definition
export interface ToolGroup {
	id: string;
	name: string;
	description: string;
	tools: AvailableTool[];
}

// Group definitions
export const toolGroups: Record<string, ToolGroup> = {
	issues: {
		id: "issues",
		name: "Issue Management",
		description: "Creation, retrieval, and search of Issues",
		tools: [getIssueTool, listIssuesTool, searchIssuesTool],
	},
	pullRequests: {
		id: "pullRequests",
		name: "Pull Request Management",
		description: "Creation, retrieval, and search of PRs",
		tools: [
			getPullRequestTool,
			listPullRequestsTool,
			getPullRequestDiffTool,
			getPullRequestFilesTool,
			getPullRequestStatusTool,
			getPullRequestCommentsTool,
			getPullRequestReviewsTool,
		],
	},
	files: {
		id: "files",
		name: "File Operations",
		description: "Retrieval and search of files",
		tools: [getFileContentsTool, searchCodeTool],
	},
	search: {
		id: "search",
		name: "Search",
		description: "Search for code, repositories, users, etc.",
		tools: [
			searchCodeTool,
			searchRepositoriesTool,
			searchUsersTool,
			searchIssuesTool,
		],
	},
	repos: {
		id: "repos",
		name: "Repository Management",
		description: "Repository operations",
		tools: [listCommitsTool, searchRepositoriesTool],
	},
	utils: {
		id: "utils",
		name: "Utilities",
		description: "Advanced operations and utility tools",
		tools: [graphqlTool, restTool],
	},
};
