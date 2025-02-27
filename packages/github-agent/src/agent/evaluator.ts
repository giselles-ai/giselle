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
	truncatedResults: z
		.boolean()
		.describe("Whether the results were truncated due to size"),
});

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

const systemPrompt = `You are an evaluator that determines whether the results of a GitHub API query plan meet the requirements.
Consider the following aspects:
1. Do the results contain the information requested in the plan?
2. Are there any errors or missing data?
3. If the results were truncated, check if the important information is still available in the truncated results. Note that truncation is only done to manage token limits and should not be a reason for replanning if the key information is present.
Respond with either "accepted" if the results are satisfactory, or "replan" if we need to try a different approach.`;

const userPrompt = ({
	plan,
	results,
	wasTruncated,
}: {
	plan: Plan;
	results: Record<string, unknown>;
	wasTruncated: boolean;
}) => `
Plan Summary: ${plan.summary}
Results were${wasTruncated ? "" : " not"} truncated.
Results:
${JSON.stringify(results, null, 2)}
Evaluate whether these results satisfy the plan requirements.`;

export class Evaluator {
	readonly model: LanguageModelV1 = openai("gpt-4o-mini");
	private readonly maxResultSize = 50000;

	private truncateResults(
		results: Map<string, unknown>,
	): [Map<string, unknown>, boolean] {
		let totalSize = 0;
		let wasTruncated = false;
		const truncatedResults = new Map<string, unknown>();

		for (const [key, value] of results.entries()) {
			const stringified = JSON.stringify(value);
			if (totalSize + stringified.length > this.maxResultSize) {
				wasTruncated = true;
				const truncatedValue = `${stringified.slice(0, this.maxResultSize - totalSize)}... (truncated)`;
				truncatedResults.set(key, truncatedValue);
				break;
			}
			truncatedResults.set(key, value);
			totalSize += stringified.length;
		}

		return [truncatedResults, wasTruncated];
	}

	async evaluate(
		plan: Plan,
		results: Map<string, unknown>,
	): Promise<EvaluationResult> {
		const [truncatedResults, wasTruncated] = this.truncateResults(results);

		const result = await generateObject({
			model: this.model,
			temperature: 0,
			schema: evaluationResultSchema,
			system: systemPrompt,
			prompt: userPrompt({
				plan,
				results: Object.fromEntries(truncatedResults),
				wasTruncated,
			}),
		});

		return result.object;
	}
}
