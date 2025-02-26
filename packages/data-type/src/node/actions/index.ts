import { z } from "zod";
import { NodeBase } from "../base";
import { GitHubContent } from "./github";
import { TextGenerationContent } from "./text-generation";
export * from "./github";
export * from "./text-generation";

// Define a type for all generation content types
export const GenerationContent = TextGenerationContent;
// In the future, this would become a union:
// export const GenerationContent = z.union([TextGenerationContent, ImageGenerationContent]);

const ActionNodeContent = z.discriminatedUnion("type", [
	TextGenerationContent,
	GitHubContent,
]);

export const ActionNode = NodeBase.extend({
	type: z.literal("action"),
	content: ActionNodeContent,
});
export type ActionNode = z.infer<typeof ActionNode>;

export function isActionNode(node: NodeBase): node is ActionNode {
	return node.type === "action";
}

// Define a Generation node that encompasses all generation types
export const GenerationNode = ActionNode.extend({
	content: GenerationContent,
});
export type GenerationNode = z.infer<typeof GenerationNode>;

// Type guard for Generation nodes
export function isGenerationNode(node: NodeBase): node is GenerationNode {
	return (
		isActionNode(node) &&
		node.content.type ===
			"textGeneration" /* || node.content.type === "imageGeneration" in the future */
	);
}

export const TextGenerationNode = ActionNode.extend({
	content: TextGenerationContent,
});
export type TextGenerationNode = z.infer<typeof TextGenerationNode>;

export const GitHubNode = ActionNode.extend({
	content: GitHubContent,
});
export type GitHubNode = z.infer<typeof GitHubNode>;
