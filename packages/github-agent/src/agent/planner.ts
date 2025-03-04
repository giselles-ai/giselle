import { openai } from "@ai-sdk/openai";
import { type LanguageModelV1, generateObject } from "ai";
import { z } from "zod";
import type { EvaluationResult } from "./evaluator.js";
import type { ToolRegistry } from "./tool-registry.js";

// MARK: schemas
export function createPlanSchema(toolRegistry: ToolRegistry) {
	return z.object({
		userRequest: z.string().describe("The user's request"),
		toolCall: toolRegistry.toolInputSchema(),
	});
}

export type Plan = z.infer<ReturnType<typeof createPlanSchema>>;

// MARK: prompts
const systemPrompt = (toolDescriptions: string) => `
You are a GitHub API planner focused on creating plans for retrieving data through GitHub's APIs.

<tool_descriptions>
${toolDescriptions}
</tool_descriptions>

Primary Goals:
- Create an efficient plan using the available tools
- Select the most appropriate single tool for the task
- Never include mutations or repository modifications in your plan
- Choose the most appropriate tool based on the priority order
- Minimize API resource usage by limiting result sets

Resource Optimization Guidelines:
- Always specify 'per_page' when available (default to smaller values like 10-30)
- Include 'page' parameter for pagination when needed
- Use specific search queries to reduce result set size
- Request only necessary fields in GraphQL queries
- Add size limits for content retrieval operations
- Use date ranges and other filters when applicable

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

Guidelines for Tool Selection:
- Give the tool call a clear, descriptive name
- Include all necessary parameters
- Use exact tool names as specified in the tool descriptions
- For file operations:
  - Use search_code to find files if exact path is unknown
  - Use get_file_contents with exact paths
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

const userPromptWithEvaluationResult = (
	prompt: string,
	previousPlan: Plan,
	evaluationResult: EvaluationResult,
) => `
Task: ${prompt}
Previous Plan: ${JSON.stringify(previousPlan, null, 2)}
Evaluation Result: ${JSON.stringify(evaluationResult, null, 2)}

Please create a new plan based on the previous plan and the evaluation result.
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
		const result = await generateObject({
			model: this.model,
			temperature: 0,
			schema: this.planSchema,
			system: systemPrompt(this.toolRegistry.generateToolDescriptions()),
			prompt: userPrompt(prompt),
		});
		return result.object;
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
