import { z } from "zod";
import { NodeBase } from "../base";
import { GitHubContent } from "./github";
import { TextGenerationContent } from "./text-generation";
export * from "./github";
export * from "./text-generation";

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

export const TextGenerationNode = ActionNode.extend({
	content: TextGenerationContent,
});
export type TextGenerationNode = z.infer<typeof TextGenerationNode>;

export const GitHubNode = ActionNode.extend({
	content: GitHubContent,
});
export type GitHubNode = z.infer<typeof GitHubNode>;
