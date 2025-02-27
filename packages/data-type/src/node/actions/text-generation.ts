import { z } from "zod";
import { Anthropic, Google, LLM, OpenAI } from "../../llm";
import { Input, NodeBase, NodeReferenceBase, Output } from "../base";

export const OpenAIContent = z.object({
	type: z.literal("textGeneration"),
	llm: OpenAI,
	prompt: z.string(),
});
export const GoogleGenerativeAIContent = z.object({
	type: z.literal("textGeneration"),
	llm: Google,
	prompt: z.string(),
});
export const AnthropicContent = z.object({
	type: z.literal("textGeneration"),
	llm: Anthropic,
	prompt: z.string(),
});

export const TextGenerationContent = z.object({
	type: z.literal("textGeneration"),
	llm: LLM,
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
