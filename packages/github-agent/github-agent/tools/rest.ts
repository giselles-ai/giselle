import type { Octokit } from "@octokit/core";
import { z } from "zod";
import { defineTool } from "../tool-registry.js";

export const restTool = defineTool({
	name: "rest",
	description: "Make requests to GitHub's REST API endpoints",
	purpose:
		"Access GitHub REST API endpoints for operations not available in GraphQL",
	inputSchema: z.object({
		tool: z.literal("rest").describe("The tool to use"),
		method: z
			.enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
			.describe("The HTTP method to use"),
		path: z.string().describe("The path to make the API call to"),
		params: z
			.record(z.string(), z.unknown())
			.optional()
			.describe("The parameters to pass to the API call"),
		format: z
			.enum(["diff", "patch", "sha", "full", "raw", "text", "html"])
			.optional()
			.describe("The media type to use for the API call"),
	}),
	execute: async (octokit: Octokit, input) => {
		const result = await octokit.request({
			method: input.method,
			url: input.path,
			params: input.params,
			mediaType: { format: input.format },
		});
		return result.data;
	},
	examples: [
		{
			input: {
				tool: "rest",
				method: "GET",
				path: "/repos/octocat/hello-world/pulls/1",
				format: "diff",
			},
			output:
				"diff --git a/file.txt b/file.txt\nindex 123..456 789\n--- a/file.txt\n+++ b/file.txt\n@@ -1,3 +1,3 @@\n-old line\n+new line\n no change",
			description: "Fetch pull request diff using REST API",
		},
	],
	constraints: [
		"Path must be a valid GitHub REST API endpoint",
		"Method must be appropriate for the endpoint",
		"Format is only applicable for specific endpoints",
	],
});
