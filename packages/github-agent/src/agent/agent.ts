import { Octokit } from "@octokit/core";
import { z } from "zod";
import { type EvaluationResult, Evaluator } from "./evaluator.js";
import { Formatter } from "./formatter.js";
import { type Plan, Planner } from "./planner.js";
import {
	type AvailableToolName,
	ToolRegistry,
	getAllToolNames,
	getToolByName,
} from "./tool-registry.js";

export const agentOptionsSchema = z.object({
	allowedToolNames: z
		.array(z.string())
		.min(1)
		.refine((names) => names.every((n) => getToolByName(n) !== undefined), {
			message: "Invalid tool name(s) provided",
		}),
	isDebug: z.boolean().optional(),
	maxRetries: z.number().optional(),
});

// Execution result types
export type ExecutionSuccess = {
	type: "success";
	json: string;
	md: string;
};

export type ExecutionFailure = {
	type: "failure";
	error: string;
	userFeedback?: string;
};

export type ExecutionResult = ExecutionSuccess | ExecutionFailure;

// Agent options type
export type AgentOptions = z.infer<typeof agentOptionsSchema>;

// MARK: Agent class
export class Agent {
	private readonly octokit: Octokit;
	private readonly planner: Planner;
	private readonly toolRegistry: ToolRegistry;
	private readonly isDebug: boolean;
	private readonly maxRetries: number;

	constructor(token: string, options: AgentOptions) {
		// Runtime validation of options
		const result = agentOptionsSchema.safeParse(options);
		if (!result.success) {
			throw new Error(
				`Invalid agent options: ${result.error.errors
					.map((err) => err.message)
					.join(", ")}`,
			);
		}

		const validOptions = result.data;
		const allowedToolNames =
			validOptions.allowedToolNames as AvailableToolName[];

		this.octokit = new Octokit({ auth: token });
		this.toolRegistry = this.createRegistry(this.octokit, allowedToolNames);
		this.planner = new Planner(this.toolRegistry);
		this.isDebug = validOptions?.isDebug ?? false;
		this.maxRetries = validOptions?.maxRetries ?? 5;
	}

	// Register specified tools
	private createRegistry(
		octokit: Octokit,
		toolNames: AvailableToolName[],
	): ToolRegistry {
		const registry = new ToolRegistry(octokit);
		registry.registerByNames(toolNames, getToolByName);
		return registry;
	}

	static fromAllTools(
		token: string,
		options: Omit<AgentOptions, "allowedToolNames"> = {},
	): Agent {
		return new Agent(token, {
			...options,
			allowedToolNames: getAllToolNames(),
		});
	}

	// Builder pattern for creating an Agent with specific tools
	static builder(): {
		withToken: (token: string) => {
			withTools: (toolNames: AvailableToolName[]) => {
				withOptions: (options: Omit<AgentOptions, "allowedToolNames">) => Agent;
				build: () => Agent;
			};
		};
	} {
		return {
			withToken: (token: string) => ({
				withTools: (toolNames: AvailableToolName[]) => ({
					withOptions: (options: Omit<AgentOptions, "allowedToolNames">) =>
						new Agent(token, { ...options, allowedToolNames: toolNames }),
					build: () => new Agent(token, { allowedToolNames: toolNames }),
				}),
			}),
		};
	}

	async execute(prompt: string): Promise<ExecutionResult> {
		const evaluator = new Evaluator();
		let attempts = 0;
		let currentPlan: Plan | undefined;
		let evaluation: EvaluationResult | undefined;

		while (attempts < this.maxRetries) {
			try {
				if (attempts === 0) {
					currentPlan = await this.planner.plan(prompt);
				} else if (currentPlan && evaluation) {
					currentPlan = await this.planner.planWithEvaluation(
						prompt,
						currentPlan,
						evaluation,
					);
				}

				if (this.isDebug) {
					console.log(`========== plan (attempt ${attempts + 1}) ==========`);
					console.dir(currentPlan, { depth: null });
					console.log("========== /plan ==========");
				}

				if (!currentPlan?.canBeExecuted) {
					return {
						type: "error",
						error: "Plan cannot be executed",
						userFeedback: currentPlan?.userFeedback,
					};
				}
				const result = await this.toolRegistry.dispatchTool(
					currentPlan.toolCall,
				);

				// Return success after dispatching
				const formatter = new Formatter();
				const formattedResult = formatter.format(result);

				return {
					type: "success",
					json: JSON.stringify(result, null, 2),
					md: formattedResult,
				};
			} catch (error) {
				console.error(`Execution attempt ${attempts + 1} failed:`, error);
				attempts++;
			}
		}

		return {
			type: "error",
			error: "Max retries reached, execution failed",
			userFeedback:
				"The operation could not be completed after multiple attempts",
		};
	}
}
