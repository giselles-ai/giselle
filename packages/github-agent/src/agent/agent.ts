import { Octokit } from "@octokit/core";
import { Evaluator } from "./evaluator.js";
import { Formatter } from "./formatter.js";
import { Planner, TaskDependencyError } from "./planner.js";
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
	evaluation: {
		decision: string;
		truncatedResults?: unknown;
	};
};

export type ExecutionFailure = {
	type: "failure";
	error: Error;
	evaluation?: {
		decision: string;
		truncatedResults?: unknown;
	};
};

export type ExecutionResult<T> = ExecutionSuccess | ExecutionFailure;

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
	private readonly evaluator: Evaluator;
	private readonly toolRegistry: ToolRegistry;
	private readonly isDebug: boolean;

	constructor(token: string, options?: { isDebug: boolean }) {
		this.octokit = new Octokit({ auth: token });
		this.toolRegistry = createRegistry(this.octokit);
		this.planner = new Planner(this.toolRegistry);
		this.evaluator = new Evaluator();
		this.isDebug = options?.isDebug ?? false;
	}

	async execute(
		prompt: string,
	): Promise<ExecutionResult<Map<string, unknown>>> {
		try {
			let plan = await this.planner.plan(prompt);
			let attempts = 0;
			const maxAttempts = 3;

			// Immediately return error if the plan has dependencies between steps
			if (plan.hasDependencies) {
				return {
					type: "failure",
					error: new TaskDependencyError(
						"Dependencies between steps are not allowed",
						plan.dependencyExplanation || "Task has dependencies between steps",
						plan,
					),
				};
			}

			while (attempts < maxAttempts) {
				if (this.isDebug) {
					console.log(`Attempt ${attempts + 1}/${maxAttempts}`);
					console.log("========== plan ==========");
					console.dir(plan, { depth: null });
					console.log("========== /plan ==========");
				}

				const results = new Map<string, unknown>();

				try {
					for (const step of plan.steps) {
						try {
							const result = await this.toolRegistry.executeTool(
								step.toolCall.tool,
								step.toolCall,
							);
							results.set(step.name, result);
						} catch (error) {
							results.set(step.name, error);
						}
					}

					const evaluation = await this.evaluator.evaluate(plan, results);

					if (evaluation.decision === "accepted") {
						const formatter = new Formatter();
						const rawJson = JSON.stringify(
							Object.fromEntries(results),
							null,
							2,
						);
						const markdown = formatter.format(results);

						return {
							type: "success",
							json: rawJson,
							md: markdown,
							evaluation,
						};
					}

					attempts++;
					if (attempts < maxAttempts) {
						if (this.isDebug) {
							console.log("========== evaluation ==========");
							console.dir(evaluation, { depth: null });
							console.log("========== /evaluation ==========");
						}

						plan = await this.planner.planWithPreviousResults(
							prompt,
							plan,
							results,
							evaluation.truncatedResults,
						);
					}
				} catch (error) {
					attempts++;
					if (attempts < maxAttempts) {
						plan = await this.planner.planWithPreviousResults(
							prompt,
							plan,
							results,
							false,
						);
						continue;
					}
					return {
						type: "failure",
						error: error instanceof Error ? error : new Error(String(error)),
					};
				}
			}

			return {
				type: "failure",
				error: new Error(
					"Maximum retry attempts reached without successful completion",
				),
				evaluation: { decision: "rejected" },
			};
		} catch (error) {
			return {
				type: "failure",
				error: error instanceof Error ? error : new Error(String(error)),
			};
		}
	}
}
