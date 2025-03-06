import { LanguageModel } from "@giselle-sdk/language-model";
import { z } from "zod";
import { NodeBase } from "../base";

export const TextGenerationContent = z.object({
	type: z.literal("textGeneration"),
	llm: LanguageModel,
	prompt: z.string().optional(),
});
export type TextGenerationContent = z.infer<typeof TextGenerationContent>;

export const TextGenerationNode = NodeBase.extend({
	type: z.literal("action"),
	content: TextGenerationContent,
});
type TextGenerationNode = z.infer<typeof TextGenerationNode>;

export function isTextGenerationNode(
	args?: unknown,
): args is TextGenerationNode {
	const result = TextGenerationNode.safeParse(args);
	return result.success;
}

export const TextGenerationContentReference = z.object({
	type: TextGenerationContent.shape.type,
});
export type TextGenerationContentReference = z.infer<
	typeof TextGenerationContentReference
>;
