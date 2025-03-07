import { openai } from "@ai-sdk/openai";
import { type LanguageModelV1, generateObject } from "ai";
import { z } from "zod";
import type { Plan } from "./planner.js";

const evaluationResultSchema = z.object({
	decision: z
		.enum(["accepted", "replan"])
		.describe("Whether to accept the results or request a replan"),
	reasoning: z.string().describe("The reasoning behind the decision"),
	suggestions: z
		.string()
		.optional()
		.describe("Suggestions for improving the plan or results"),
});

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

const systemPrompt = `You are an evaluator that determines whether the results of a GitHub API query plan meet the requirements.
Consider the following aspects:
1. Do the results contain the information requested in the plan?
2. Are there any errors or missing data?
3. If the results were truncated, check if the important information is still available in the truncated results. Note that truncation is only done to manage token limits and should not be a reason for replanning if the key information is present.
Respond with either "accepted" if the results are satisfactory, or "replan" if we need to try a different approach.`;

function compressResult(result: unknown, maxLength = 100): unknown {
	if (result === null || result === undefined) return result;

	if (typeof result === "object") {
		if (Array.isArray(result)) {
			return result.map((item) => {
				if (typeof item === "string") {
					return item.length > maxLength
						? `${item.slice(0, maxLength)}...`
						: item;
				}
				return compressResult(item, maxLength);
			});
		}

		const compressed: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(result)) {
			if (typeof value === "string") {
				compressed[key] =
					value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
			} else {
				compressed[key] = compressResult(value, maxLength);
			}
		}
		return compressed;
	}

	if (typeof result === "string") {
		return result.length > maxLength
			? `${result.slice(0, maxLength)}...`
			: result;
	}

	return result;
}

const userPrompt = ({
	plan,
	result,
}: {
	plan: Plan;
	result: unknown;
}) => `
User request: ${plan.userRequest}
Results:
${JSON.stringify(compressResult(result), null, 2)}
Evaluate whether these results satisfy the plan requirements.`;

export class Evaluator {
	readonly model: LanguageModelV1 = openai("gpt-4o-mini");

	async evaluate(plan: Plan, result: unknown): Promise<EvaluationResult> {
		const evaluation = await generateObject({
			model: this.model,
			temperature: 0,
			schema: evaluationResultSchema,
			system: systemPrompt,
			prompt: userPrompt({
				plan,
				result,
			}),
		});

		return evaluation.object;
	}
}
