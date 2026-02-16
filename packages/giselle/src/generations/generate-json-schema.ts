import { createGateway } from "@ai-sdk/gateway";
import { generateText, Output } from "ai";
import * as z from "zod/v4";
import { createGiselleFunction } from "../utils/create-giselle-function";

const GENERATED_SCHEMA_MODEL_ID = "anthropic/claude-haiku-4.5";
export const generateJsonSchema = createGiselleFunction({
	input: z.object({
		description: z.string().trim().min(1),
	}),
	handler: async ({ input }) => {
		const gateway = createGateway();
		let result: Awaited<ReturnType<typeof generateText>>;
		try {
			result = await generateText({
				model: gateway(GENERATED_SCHEMA_MODEL_ID),
				maxOutputTokens: 4096,
				experimental_output: Output.object({
					schema: z.object({
						type: z.literal("object"),
						properties: z.record(z.string(), z.unknown()),
						required: z.array(z.string()).optional(),
						additionalProperties: z.boolean(),
					}),
				}),
				system: [
					"You generate JSON Schema documents for structured output.",
					'The root schema must be {"type":"object", ...}.',
					"Do not use $ref or definitions. Inline all types directly.",
					"Add descriptions for non-obvious properties.",
				"Prefer clear property names and include required fields when confidence is high.",
				].join(" "),
				prompt: `Create a JSON Schema for this requirement:\n${input.description}`,
			});
		} catch (error) {
			console.error("[generateJsonSchema] generation failed:", error);
			throw new Error(
				"Failed to generate schema. The description may be too complex. Try simplifying it.",
			);
		}

		console.log("[generateJsonSchema] usage:", result.usage);

		return {
			schema: JSON.stringify(result.experimental_output, null, 2),
		};
	},
});
