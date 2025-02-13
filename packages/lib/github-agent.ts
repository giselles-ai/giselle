import { agents, db, githubIntegrationSettings } from "@/drizzle";
import {
	buildAppClient,
	buildAppInstallationClient,
} from "@/services/external/github";
import { openai } from "@ai-sdk/openai";
import type { Octokit } from "@octokit/core";
import {
	InvalidToolArgumentsError,
	NoSuchToolError,
	Output,
	ToolExecutionError,
	generateText,
	tool,
} from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { AgentId } from "../types";
import type { GitHubIntegrationSetting } from "./github";

export async function fetchGitHubIntegrationSetting(agentId: AgentId) {
	const res = await db
		.select()
		.from(githubIntegrationSettings)
		.innerJoin(agents, eq(githubIntegrationSettings.agentDbId, agents.dbId))
		.where(eq(agents.id, agentId))
		.limit(1);
	if (res.length === 0) {
		throw new Error("GitHub integration setting not found");
	}
	return res[0].github_integration_settings;
}

// Fetch installation id from repository name
// FIXME: add githubIntegrationSetting.installationId column is preferred
export async function fetchInstallationId(
	integrationSetting: GitHubIntegrationSetting,
) {
	const appClient = await buildAppClient();
	const [owner, repo] = integrationSetting.repositoryFullName.split("/");
	const { data: installation } = await appClient.request(
		"GET /repos/{owner}/{repo}/installation",
		{
			owner,
			repo,
		},
	);
	return installation.id;
}

export const githubArtifactSchema = z.object({
	plan: z
		.string()
		.describe(
			"How do you create the artifact. It must includes what resource to retrieve and what API calls to make.",
		),
	title: z.string().describe("The title of the artifact"),
	content: z
		.string()
		.describe("The content of the artifact formatted markdown."),
	description: z
		.string()
		.describe(
			"Explanation of the Artifact and what the intention was in creating this Artifact. Add any suggestions for making it even better. This includes what API calls are made and what resources are retrieved.",
		),
});

export type GitHubArtifact = z.infer<typeof githubArtifactSchema>;

export class GitHubAgent {
	readonly MAX_STEPS = 5;
	readonly MODEL = openai("gpt-4o-mini");

	private client: Octokit;
	private constructor(client: Octokit) {
		this.client = client;
	}

	public static async build(installationId: number) {
		const client = await buildAppInstallationClient(installationId);
		return new GitHubAgent(client);
	}

	public async execute(prompt: string) {
		try {
			const res = await generateText({
				model: this.MODEL,
				tools: this.tools(),
				maxSteps: this.MAX_STEPS,
				experimental_output: Output.object({
					schema: githubArtifactSchema,
				}),
				temperature: 0,
				system: `You are a GitHub API expert specializing in GraphQL queries and data analysis.

Key responsibilities:
- Execute and analyze GitHub GraphQL queries accurately
- Provide detailed insights from repository data
- Follow security best practices and API guidelines
- NEVER perform mutations or modify repository data

If asked to modify GitHub data:
- Politely explain that you cannot perform mutations
- Suggest alternative read-only approaches if applicable
- Provide clear explanations for any limitations

Always prioritize:
- Data accuracy and completeness
- Clear and structured responses
- Efficient query optimization
- Rate limit consideration`,
				prompt,
			});

			return { result: res.experimental_output, usage: res.usage };
		} catch (error: unknown) {
			if (NoSuchToolError.isInstance(error)) {
				throw new Error(
					"The requested tool does not exist. Please check the available tools and try again.",
				);
			}
			if (InvalidToolArgumentsError.isInstance(error)) {
				throw new Error(
					"Invalid arguments provided to tool. Please check the tool documentation and try again.",
				);
			}
			if (ToolExecutionError.isInstance(error)) {
				throw new Error(
					"An error occurred while executing the tool. Please try again.",
				);
			}
			throw error;
		}
	}

	private tools() {
		return {
			query: tool({
				description: "Executes a GitHub GraphQL query with optional variables.",
				parameters: z.object({
					query: z.string(),
					variables: z.record(z.any()).optional(),
				}),
				execute: async ({ query, variables }) => {
					const res = await this.client.request("POST /graphql", {
						query,
						variables,
					});
					return res.data;
				},
			}),
		};
	}
}
