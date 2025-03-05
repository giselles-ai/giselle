import { openai } from "@ai-sdk/openai";
import {
	type LanguageModelV1,
	NoObjectGeneratedError,
	generateObject,
} from "ai";
import { z } from "zod";
import type { EvaluationResult } from "./evaluator.js";
import type { ToolRegistry } from "./tool-registry.js";

// MARK: schemas
export function createPlanSchema(toolRegistry: ToolRegistry) {
	return z.object({
		userRequest: z.string().describe("The user's request"),
		toolCall: toolRegistry.toolInputSchema(),
		canBeExecuted: z
			.boolean()
			.describe("Whether the task can be executed with the available tools"),
		userFeedback: z
			.string()
			.describe(
				"Feedback to the user if the task cannot be executed with available tools",
			),
	});
}

export type Plan = z.infer<ReturnType<typeof createPlanSchema>>;

// MARK: prompts
const systemPrompt = (toolDescriptions: string) => `
You are a GitHub API planner focused on creating plans for retrieving data through GitHub's APIs.

<tool_descriptions>
${toolDescriptions}
</tool_descriptions>

IMPORTANT CONTEXT: The available tools shown above have been pre-selected by the user. You MUST respect their choice and use ONLY these tools.

Primary Goals:
- Create an efficient plan using ONLY the available tools shown in the tool_descriptions
- Select the most appropriate single tool from the available options
- Never include mutations or repository modifications in your plan
- Minimize API resource usage by limiting result sets
- If the requested task CANNOT be accomplished with the available tools, explain why and suggest alternatives

Resource Optimization Guidelines:
- Always specify 'per_page' when available (default to smaller values like 10-30)
- Include 'page' parameter for pagination when needed
- Use specific search queries to reduce result set size
- Add size limits for content retrieval operations
- Use date ranges and other filters when applicable

Guidelines for Tool Selection:
- Give the tool call a clear, descriptive name
- Include all necessary parameters
- Use exact tool names as specified in the tool descriptions
- If the user's request cannot be fulfilled with the available tools, set canBeExecuted to false and provide helpful feedback

Examples of Tool Selection:
1. To find repositories: Use search_repositories tool (if available)
2. To get file contents: Use get_file_contents tool (if available)
3. To find issues: Use search_issues or list_issues tools (if available)

Task Feasibility Assessment:
- Carefully analyze whether the user's request can be fulfilled with the available tools
- If the task cannot be executed with the available tools, set canBeExecuted to false
- Provide clear feedback on what is missing and suggest alternatives if possible

Your response MUST include:
1. The user's request (userRequest)
2. The appropriate tool call with parameters (toolCall)
3. Whether the task can be executed (canBeExecuted)
4. Feedback to the user if the task cannot be executed (userFeedback)
`;

const userPrompt = (prompt: string) => `
Task: ${prompt}
`;

const userPromptWithEvaluationResult = (
	prompt: string,
	previousPlan: Plan,
	evaluationResult: EvaluationResult,
) => `
Task: ${prompt}
Previous Plan: ${JSON.stringify(previousPlan, null, 2)}
Evaluation Result: ${JSON.stringify(evaluationResult, null, 2)}

Please create a new plan based on the previous plan and the evaluation result.
Remember to respect the available tools and assess whether the task can be executed.
`;

// MARK: class
export class Planner {
	readonly model: LanguageModelV1 = openai("gpt-4o-mini");
	private readonly toolRegistry: ToolRegistry;
	private readonly planSchema: z.ZodType<Plan>;

	constructor(toolRegistry: ToolRegistry) {
		this.toolRegistry = toolRegistry;
		this.planSchema = createPlanSchema(toolRegistry) as z.ZodType<Plan>;
	}

	async plan(prompt: string): Promise<Plan> {
		try {
			const result = await generateObject({
				model: this.model,
				temperature: 0,
				schema: this.planSchema,
				system: systemPrompt(this.toolRegistry.generateToolDescriptions()),
				prompt: userPrompt(prompt),
			});
			return result.object;
		} catch (error) {
			if (NoObjectGeneratedError.isInstance(error)) {
				console.log("======= NoObjectGeneratedError ========");
				console.log("Cause:", error.cause);
				console.log("Text:", error.text);
				console.log("Response:", error.response);
				console.log("Usage:", error.usage);
			}
			throw error;
		}
	}

	async planWithEvaluation(
		prompt: string,
		previousPlan: Plan,
		evaluationResult: EvaluationResult,
	): Promise<Plan> {
		const result = await generateObject({
			model: this.model,
			temperature: 0,
			schema: this.planSchema,
			system: systemPrompt(this.toolRegistry.generateToolDescriptions()),
			prompt: userPromptWithEvaluationResult(
				prompt,
				previousPlan,
				evaluationResult,
			),
		});
		return result.object;
	}
}
