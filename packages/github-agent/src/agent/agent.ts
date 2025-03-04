import { Octokit } from "@octokit/core";
import { Evaluator } from "./evaluator.js";
import { Formatter } from "./formatter.js";
import { Planner } from "./planner.js";
import { ToolRegistry } from "./tool-registry.js";
import {
	getFileContentsTool,
	getIssueTool,
	getPullRequestDiffTool,
	listCommitsTool,
	listIssuesTool,
} from "./tools/read.js";
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

	// Register read tools
	registry.register(getFileContentsTool);
	registry.register(getIssueTool);
	registry.register(listIssuesTool);
	registry.register(listCommitsTool);
	registry.register(getPullRequestDiffTool);

	// Register search tools
	registry.register(searchCodeTool);
	registry.register(searchRepositoriesTool);
	registry.register(searchUsersTool);
	registry.register(searchIssuesTool);

	return registry;
}

export class Agent {
	private readonly octokit: Octokit;
	private readonly planner: Planner;
	private readonly toolRegistry: ToolRegistry;
	private readonly isDebug: boolean;
	private readonly maxRetries: number;

	constructor(
		token: string,
		options?: { isDebug: boolean; maxRetries?: number },
	) {
		this.octokit = new Octokit({ auth: token });
		this.toolRegistry = createRegistry(this.octokit);
		this.planner = new Planner(this.toolRegistry);
		this.isDebug = options?.isDebug ?? false;
		this.maxRetries = options?.maxRetries ?? 5;
	}

	async execute(prompt: string): Promise<ExecutionResult> {
		const evaluator = new Evaluator();
		let attempts = 0;

		while (attempts < this.maxRetries) {
			try {
				const plan = await this.planner.plan(prompt);
				if (this.isDebug) {
					console.log(`========== plan (attempt ${attempts + 1}) ==========`);
					console.dir(plan, { depth: null });
					console.log("========== /plan ==========");
				}

				const result = await this.toolRegistry.executeTool(
					plan.toolCall.tool,
					plan.toolCall,
				);

				const evaluation = await evaluator.evaluate(plan, result);
				if (evaluation.decision === "accepted") {
					const formatter = new Formatter();
					const rawJson = JSON.stringify(result, null, 2);
					const markdown = formatter.format(result);
					return {
						type: "success",
						json: rawJson,
						md: markdown,
					};
				}

				attempts++;
				if (attempts >= this.maxRetries) {
					return {
						type: "failure",
						error: new Error("Maximum retry attempts reached"),
					};
				}
			} catch (error) {
				console.error(`Error on attempt ${attempts + 1}:`, error);
				attempts++;
				if (attempts >= this.maxRetries) {
					return {
						type: "failure",
						error: error instanceof Error ? error : new Error(String(error)),
					};
				}
			}
		}

		return {
			type: "failure",
			error: new Error("All retry attempts failed"),
		};
	}
}
