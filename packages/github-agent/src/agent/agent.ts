import { Octokit } from "@octokit/core";
import { Formatter } from "./formatter.js";
import { Planner } from "./planner.js";
import { ToolRegistry } from "./tool-registry.js";
import { graphqlTool } from "./tools/graphql.js";
import {
	getFileContentsTool,
	getIssueTool,
	getPullRequestDiffTool,
	listCommitsTool,
	listIssuesTool,
} from "./tools/read.js";
import { restTool } from "./tools/rest.js";
import {
	searchCodeTool,
	searchIssuesTool,
	searchRepositoriesTool,
	searchUsersTool,
} from "./tools/search.js";

export type ExecutionSuccess = {
	type: "success";
	json: string;
	md: string;
};

export type ExecutionFailure = {
	type: "failure";
	error: Error;
};

export type ExecutionResult = ExecutionSuccess | ExecutionFailure;

// Create registry with all tools
function createRegistry(octokit: Octokit): ToolRegistry {
	const registry = new ToolRegistry(octokit);

	// Register GraphQL tool (primary tool for structured data)
	registry.register(graphqlTool);

	// Register specialized read tools
	registry.register(getFileContentsTool);
	registry.register(getIssueTool);
	registry.register(listIssuesTool);
	registry.register(listCommitsTool);
	registry.register(getPullRequestDiffTool);

	// Register specialized search tools
	registry.register(searchCodeTool);
	registry.register(searchRepositoriesTool);
	registry.register(searchUsersTool);
	registry.register(searchIssuesTool);

	// Register REST tool (fallback for special cases)
	registry.register(restTool);

	return registry;
}

export class Agent {
	private readonly octokit: Octokit;
	private readonly planner: Planner;
	private readonly toolRegistry: ToolRegistry;
	private readonly isDebug: boolean;

	constructor(token: string, options?: { isDebug: boolean }) {
		this.octokit = new Octokit({ auth: token });
		this.toolRegistry = createRegistry(this.octokit);
		this.planner = new Planner(this.toolRegistry);
		this.isDebug = options?.isDebug ?? false;
	}

	async execute(prompt: string): Promise<ExecutionResult> {
		try {
			const plan = await this.planner.plan(prompt);
			if (this.isDebug) {
				console.log("========== plan ==========");
				console.dir(plan, { depth: null });
				console.log("========== /plan ==========");
			}

			try {
				const result = await this.toolRegistry.executeTool(
					plan.toolCall.tool,
					plan.toolCall,
				);
				const formatter = new Formatter();
				const rawJson = JSON.stringify(result, null, 2);
				const markdown = formatter.format(result);

				return {
					type: "success",
					json: rawJson,
					md: markdown,
				};
			} catch (error) {
				console.error("Error executing tool:", error);
				return {
					type: "failure",
					error: new Error("Tool execution failed"),
				};
			}
		} catch (error: unknown) {
			return {
				type: "failure",
				error: error instanceof Error ? error : new Error(String(error)),
			};
		}
	}
}
