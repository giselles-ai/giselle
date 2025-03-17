import { z } from "zod";
import { NodeBase, NodeReferenceBase, OverrideNodeBase } from "../base";
import {
	ImageGenerationContent,
	ImageGenerationContentReference,
	OverrideImageGenerationContent,
} from "./image-generation";
import {
	OverrideTextGenerationContent,
	TextGenerationContent,
	TextGenerationContentReference,
} from "./text-generation";
export * from "./text-generation";

const ActionNodeContent = z.discriminatedUnion("type", [
	TextGenerationContent,
	ImageGenerationContent,
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

export const ImageGenerationNode = ActionNode.extend({
	content: ImageGenerationContent,
});
type ImageGenerationNode = z.infer<typeof ImageGenerationNode>;

export function isImageGenerationNode(
	args?: unknown,
): args is ImageGenerationNode {
	const result = ImageGenerationNode.safeParse(args);
	return result.success;
}

const OverrideActionNodeContent = z.discriminatedUnion("type", [
	OverrideTextGenerationContent,
	OverrideImageGenerationContent,
]);
export const OverrideActionNode = OverrideNodeBase.extend({
	type: ActionNode.shape.type,
	content: OverrideActionNodeContent,
});
export type OverrideActionNode = z.infer<typeof OverrideActionNode>;

const ActionNodeContentReference = z.discriminatedUnion("type", [
	TextGenerationContentReference,
	ImageGenerationContentReference,
]);
export const ActionNodeReference = NodeReferenceBase.extend({
	type: ActionNode.shape.type,
	content: ActionNodeContentReference,
});
export type ActionNodeReference = z.infer<typeof ActionNodeReference>;
