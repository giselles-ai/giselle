import { openai } from "@ai-sdk/openai";
import { type LanguageModelV1, generateObject } from "ai";
import { z } from "zod";
import type { ToolRegistry } from "./tool-registry.js";

// MARK: schemas
export function createPlanSchema(toolRegistry: ToolRegistry) {
	const planStepSchema = z.object({
		name: z.string().describe("The name of the step"),
		toolCall: toolRegistry.toolInputSchema(),
	});

	return z.object({
		userRequest: z.string().describe("The user's request"),
		steps: z.array(planStepSchema).describe("The steps to complete the task"),
		summary: z.string().describe("A summary of the plan"),
		reasoning: z
			.string()
			.describe("The reasoning for why these steps are necessary"),
		hasDependencies: z
			.boolean()
			.describe(
				"Whether this plan has steps that depend on results from previous steps",
			),
		dependencyExplanation: z
			.string()
			.optional()
			.describe(
				"If hasDependencies is true, explanation of the dependencies and how to split the task",
			),
	});
}

export type Plan = z.infer<ReturnType<typeof createPlanSchema>>;
export type PlanStep = z.infer<
	ReturnType<typeof createPlanSchema>
>["steps"][number];

// Error class for dependency issues
export class TaskDependencyError extends Error {
	constructor(
		message: string,
		public readonly explanation: string,
		public readonly plan: Plan,
	) {
		super(message);
		this.name = "TaskDependencyError";
	}
}

// MARK: prompts
const systemPrompt = (toolDescriptions: string) => `
You are a GitHub API planner focused on creating plans for retrieving data through GitHub's APIs.

<tool_descriptions>
${toolDescriptions}
</tool_descriptions>

Primary Goals:
- Create efficient plans using the available tools
- Break down complex tasks into multiple steps when necessary
- Never include mutations or repository modifications in your plans
- Choose the most appropriate tool for each task based on the priority order
- Create independent steps that don't rely on previous results

Tool Selection Priority:
1. Use specialized tools first:
  - Search tools (search_code, search_repositories, search_users, search_issues)
    - Best for finding content across repositories
    - Supports complex search queries and filters
    - Optimized for specific resource types
    - For code search, include enough context in the query (path:, language:, etc.)
  - Read tools (get_file_contents, get_issue, list_issues, list_commits, get_pull_request_diff)
    - Direct access to specific resources
    - Efficient for known resource retrieval
    - For file contents, use exact paths or search first
    - For multiple files, create separate steps for each file

2. Use GraphQL API when:
  - Need to combine multiple resource types in one query
  - Want to specify exact fields to fetch
  - Need to traverse relationships between resources
  - No specialized tool exactly matches the requirements
  - Always include necessary variables when the query requires arguments
  - For parameterized queries, use variables to pass arguments safely
  - Never include literal values directly in queries
  - Variables must match the query's defined arguments
  - Response will be in JSON format with a 'data' field

3. Use REST API only as a last resort when:
  - Need specific media formats not covered by specialized tools
  - Accessing endpoints not available in GraphQL or specialized tools
  - No GraphQL query or specialized tool exists for the task
  - Working with binary or non-JSON responses
  - Response will include status, url, headers, and data fields

Guidelines for Steps:
- Give each step a clear, descriptive name
- Include all necessary parameters
- Use exact tool names as specified in the tool descriptions
- Make each step independent and self-contained
- Each step must be unique and avoid duplicate tool calls
- For file operations:
  - Use search_code to find files first if exact path is unknown
  - Use get_file_contents with exact paths
  - Create separate steps for each file to be retrieved
  - Include file extension in search queries when possible

Examples of Tool Selection:
1. To find repositories: Use search_repositories tool
2. To get file contents: Use get_file_contents tool with exact path
3. To find issues: Use search_issues or list_issues tools
4. To get commit history: Use list_commits tool
5. To get PR changes: Use get_pull_request_diff tool
6. For complex queries: Use graphql tool
7. For raw content: Use get_file_contents tool

Common Use Cases:
1. Finding and Reading Files:
   - Use search_code to find relevant files
   - Create separate get_file_contents steps for each file
   - Include file extensions and paths in search queries
   - Never make steps dependent on search results

2. Analyzing Code:
   - Use search_code with specific file types and content
   - Use get_file_contents for known files
   - Use get_pull_request_diff for changes
   - Create independent steps for each operation

3. Issue Management:
   - Use search_issues for finding specific issues
   - Use list_issues for repository issue lists
   - Use get_issue for detailed information
`;

const userPrompt = (prompt: string) => `
Task: ${prompt}
`;

const userPromptWithPreviousResults = (
	prompt: string,
	previousPlan: Plan,
	previousResults: Record<string, unknown>,
	wasTruncated: boolean,
) => `
User Request: ${prompt}

Previous attempt:
${JSON.stringify(previousPlan, null, 2)}

Previous results (${wasTruncated ? "truncated" : "complete"}):
${JSON.stringify(previousResults, null, 2)}

Please create a new plan that addresses any issues with the previous attempt.`;

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
		const result = await generateObject({
			model: this.model,
			temperature: 0,
			schema: this.planSchema,
			system: systemPrompt(this.toolRegistry.generateToolDescriptions()),
			prompt: userPrompt(prompt),
		});

		return result.object;
	}

	async planWithPreviousResults(
		prompt: string,
		previousPlan: Plan,
		previousResults: Map<string, unknown>,
		wasTruncated: boolean,
	): Promise<Plan> {
		const result = await generateObject({
			model: this.model,
			temperature: 0,
			schema: this.planSchema,
			system: systemPrompt(this.toolRegistry.generateToolDescriptions()),
			prompt: userPromptWithPreviousResults(
				prompt,
				previousPlan,
				Object.fromEntries(previousResults),
				wasTruncated,
			),
		});

		return result.object;
	}
}
