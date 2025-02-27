import type { Octokit } from "@octokit/core";
import type { GraphQlQueryResponse } from "@octokit/graphql/types";
import { z } from "zod";
import { defineTool } from "../tool-registry.js";

export const graphqlTool = defineTool({
	name: "graphql",
	description: "Execute GraphQL queries against GitHub's GraphQL API",
	purpose: "Make queries to GitHub's GraphQL API to retrieve data efficiently",
	inputSchema: z.object({
		tool: z.literal("graphql").describe("The tool to use"),
		query: z.string().describe("The GraphQL query to make"),
		variables: z
			.record(z.string(), z.unknown())
			.optional()
			.describe("The variables to pass to the GraphQL query"),
	}),
	execute: async (octokit: Octokit, input) => {
		return (await octokit.graphql(
			input.query,
			input.variables,
		)) as GraphQlQueryResponse<unknown>;
	},
	examples: [
		{
			input: {
				tool: "graphql",
				query: `query($owner: String!, $repo: String!, $number: Int!) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $number) {
              title
              state
              author { login }
              createdAt
            }
          }
        }`,
				variables: {
					owner: "octocat",
					repo: "hello-world",
					number: 1,
				},
			},
			output: {
				data: {
					repository: {
						pullRequest: {
							title: "Example PR",
							state: "OPEN",
							author: { login: "octocat" },
							createdAt: "2024-01-01T00:00:00Z",
						},
					},
				},
			},
			description: "Fetch pull request information using GraphQL",
		},
	],
	constraints: [
		"Must provide valid GraphQL query",
		"Variables must match query parameters",
		"Query must not include mutations",
	],
});
