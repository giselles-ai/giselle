import type { Octokit } from "@octokit/core";
import { z } from "zod";
import { defineTool } from "../tool-types.js";

// Common parameters for all search tools
const commonSearchParams = {
	query: z.string().describe("The search query string"),
	page: z.number().min(1).optional().describe("Page number of results"),
	per_page: z
		.number()
		.min(1)
		.max(100)
		.optional()
		.describe("Results per page (max 100)"),
	order: z
		.enum(["asc", "desc"])
		.optional()
		.describe("Sort order (ascending or descending)"),
};

// Code search tool
export const searchCodeTool = defineTool({
	name: "search_code",
	description: "Search for code across GitHub repositories",
	purpose:
		"Find code snippets and files across GitHub using various search qualifiers",
	inputSchema: z.object({
		tool: z.literal("search_code"),
		...commonSearchParams,
		sort: z
			.enum(["indexed"])
			.optional()
			.describe("Sort option for code search"),
	}),
	execute: async (octokit: Octokit, input) => {
		const result = await octokit.request("GET /search/code", {
			q: input.query,
			sort: input.sort,
			order: input.order,
			per_page: input.per_page,
			page: input.page,
		});
		return result.data;
	},
	constraints: [
		"Code search requires authentication",
		"Rate limit: 10 requests per minute",
		"Maximum file size searchable is 384 KB",
		"Only the default branch is searchable",
		"Supports qualifiers:",
		"  - language: Filter by programming language",
		"  - in:file: Search in file contents",
		"  - in:path: Search in file paths",
		"  - repo: Limit to specific repository",
		"  - org: Limit to specific organization",
		"  - user: Limit to specific user",
		"  - extension: Filter by file extension",
		"  - size: Filter by file size (<, >, =)",
		"  - path: Filter by file location",
		"  - filename: Search by exact file name",
		"  - fork: Include (true) or exclude (false) forks",
		"Binary files are not searchable",
	],
});

// Repository search tool
export const searchRepositoriesTool = defineTool({
	name: "search_repositories",
	description: "Search for repositories on GitHub",
	purpose:
		"Find repositories based on various criteria like language, stars, topics etc.",
	inputSchema: z.object({
		tool: z.literal("search_repositories"),
		...commonSearchParams,
		sort: z
			.enum(["stars", "forks", "help-wanted-issues", "updated"])
			.optional()
			.describe(
				"Sort repositories by stars, forks, help wanted issues, or last updated",
			),
	}),
	execute: async (octokit: Octokit, input) => {
		const result = await octokit.request("GET /search/repositories", {
			q: input.query,
			sort: input.sort,
			order: input.order,
			per_page: input.per_page,
			page: input.page,
		});
		return result.data;
	},
	constraints: [
		"Rate limit: 30 requests per minute",
		"Supports qualifiers:",
		"  - language: Programming language",
		"  - stars: Number of stars",
		"  - forks: Number of forks",
		"  - size: Repository size in KB",
		"  - fork: Include (true) or exclude (false) forks",
		"  - created/pushed: Repository creation or last push date",
		"  - user/org: Owner",
		"  - topic: Repository topics",
		"  - license: Repository license",
		"  - is: public/private",
		"  - mirror: true/false",
		"  - archived: true/false",
		"Sort options affect the relevance of results",
	],
});

// User search tool
export const searchUsersTool = defineTool({
	name: "search_users",
	description: "Search for users on GitHub",
	purpose: "Find GitHub users based on various criteria",
	inputSchema: z.object({
		tool: z.literal("search_users"),
		...commonSearchParams,
		sort: z
			.enum(["followers", "repositories", "joined"])
			.optional()
			.describe(
				"Sort users by number of followers, repositories, or join date",
			),
	}),
	execute: async (octokit: Octokit, input) => {
		const result = await octokit.request("GET /search/users", {
			q: input.query,
			sort: input.sort,
			order: input.order,
			per_page: input.per_page,
			page: input.page,
		});
		return result.data;
	},
	constraints: [
		"Rate limit: 30 requests per minute",
		"Supports qualifiers:",
		"  - type: user/org",
		"  - in: Search in username, email, fullname",
		"  - fullname: Full name of user",
		"  - email: Email address",
		"  - repos: Number of repositories",
		"  - location: User's location",
		"  - language: Language of repositories",
		"  - created: User creation date",
		"  - followers: Number of followers",
		"  - fork: Has forked repositories",
		"  - is: Organization member status",
		"Name searches are case-insensitive",
		"Partial matches are supported for username and email",
	],
});

// Issue search tool
export const searchIssuesTool = defineTool({
	name: "search_issues",
	description: "Search for issues and pull requests across GitHub repositories",
	purpose: "Find issues and pull requests based on various criteria",
	inputSchema: z.object({
		tool: z.literal("search_issues"),
		...commonSearchParams,
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
			.optional()
			.describe(
				"Sort issues by various criteria including reactions and interactions",
			),
	}),
	execute: async (octokit: Octokit, input) => {
		const result = await octokit.request("GET /search/issues", {
			q: input.query,
			sort: input.sort,
			order: input.order,
			per_page: input.per_page,
			page: input.page,
		});
		return result.data;
	},
	constraints: [
		"Rate limit: 30 requests per minute",
		"Searches both issues and pull requests",
		"Supports qualifiers:",
		"  - type: issue/pr",
		"  - is: open/closed/merged/unmerged",
		"  - author: Issue author",
		"  - assignee: Assigned user",
		"  - mentions: Mentioned user",
		"  - commenter: Commenting user",
		"  - involves: User involved in any way",
		"  - team: Team mentioned",
		"  - label: Issue labels",
		"  - milestone: Issue milestone",
		"  - project: Project board",
		"  - status: PR status (success/failure/pending)",
		"  - head/base: PR head or base branch",
		"  - draft: PR draft status",
		"  - review: PR review status",
		"  - reviewed-by/review-requested: PR review participants",
		"  - created/updated/closed/merged: Timestamp filters",
		"  - repo: Repository filter",
		"  - org: Organization filter",
		"  - archived: Include archived repositories",
		"Reactions can be used for sorting",
		"Comments are searchable",
		"Labels are case-insensitive",
	],
});
