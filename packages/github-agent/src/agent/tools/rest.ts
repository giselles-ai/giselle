import type { Octokit } from "@octokit/core";
import type { OctokitResponse } from "@octokit/types";
import { z } from "zod";
import { defineTool } from "../tool-types.js";

export const restTool = defineTool({
	name: "rest",
	description: "Make a REST API request to GitHub's API",
	purpose: "For making REST API requests to GitHub",
	inputSchema: z.object({
		tool: z.literal("rest"),
		endpoint: z.string().describe("The REST API endpoint to call"),
		method: z
			.enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
			.describe("The HTTP method to use"),
		params: z
			.record(z.string(), z.unknown())
			.optional()
			.describe("The parameters to pass to the REST API request"),
	}),
	execute: async (
		octokit: Octokit,
		input,
	): Promise<OctokitResponse<unknown>> => {
		const { endpoint, method, params } = input;
		return await octokit.request(`${method} ${endpoint}`, params);
	},
	constraints: [
		"Must provide valid REST API endpoint",
		"Must use correct HTTP method",
		"Parameters must match endpoint requirements",
	],
});
