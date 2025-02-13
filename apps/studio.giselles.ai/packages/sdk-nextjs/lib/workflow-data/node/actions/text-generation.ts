import { z } from "zod";
import { BaseNodeData, ConnectionHandle, nodeId } from "../types";
// import type { WorkflowData } from "./workflow-state";

export const TextGenerationContent = z.object({
	type: z.literal("textGeneration"),
	llm: z.string(),
	temperature: z.number(),
	topP: z.number(),
	prompt: z.string(),
	requirement: z.optional(ConnectionHandle),
	system: z.string(),
	sources: z.array(ConnectionHandle),
});
type TextGenerationContent = z.infer<typeof TextGenerationContent>;

export const TextGenerationNodeData = BaseNodeData.extend({
	type: z.literal("action"),
	content: TextGenerationContent,
});
type TextGenerationNodeData = z.infer<typeof TextGenerationNodeData>;

export const CreateTextGenerationNodeParams = TextGenerationContent.omit({
	type: true,
})
	.partial()
	.extend({
		name: z.string(),
	});

export function isTextGenerationNode(node: {
	type: string;
	content: unknown;
}): node is { type: "action"; content: TextGenerationContent } {
	return (
		node.type === "action" &&
		(node.content as TextGenerationContent).type === "textGeneration"
	);
}

export function createTextGenerationNodeData(
	params: z.infer<typeof CreateTextGenerationNodeParams>,
): z.infer<typeof TextGenerationNodeData> {
	return {
		id: nodeId.generate(),
		name: params.name,
		type: "action",
		content: {
			type: "textGeneration",
			llm: params.llm ?? "openai:gpt-4o",
			temperature: params.temperature ?? 0.7,
			topP: params.topP ?? 1.0,
			requirement: params.requirement,
			prompt: params.prompt ?? "",
			system: params.system ?? "",
			sources: params.sources ?? [],
		},
	};
}
