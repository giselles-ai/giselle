import { z } from "zod/v4";
import { NodeBase, NodeReferenceBase, OverrideNodeBase } from "../base";
import { ActionContent, ActionContentReference } from "./action";
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
import { TriggerContent, TriggerContentReference } from "./trigger";
export * from "./image-generation";
export * from "./text-generation";
export * from "./trigger";
export * from "./action";

const OperationNodeContent = z.discriminatedUnion("type", [
	TextGenerationContent,
	ImageGenerationContent,
	TriggerContent,
	ActionContent,
]);

export const OperationNode = NodeBase.extend({
	type: z.literal("operation"),
	content: OperationNodeContent,
});
export type OperationNode = z.infer<typeof OperationNode>;

export function isOperationNode(node: NodeBase): node is OperationNode {
	return node.type === "operation";
}

export const OperationNodeLike = NodeBase.extend({
	type: z.literal("operation"),
	content: z.looseObject({
		type: z.union([
			TextGenerationContent.shape.type,
			ImageGenerationContent.shape.type,
			TriggerContent.shape.type,
			ActionContent.shape.type,
		]),
	}),
});

export type OperationNodeLike = z.infer<typeof OperationNodeLike>;

export const TextGenerationNode = OperationNode.extend({
	type: z.literal("operation"),
	content: TextGenerationContent,
});
type TextGenerationNode = z.infer<typeof TextGenerationNode>;

export function isTextGenerationNode(
	args?: unknown,
): args is TextGenerationNode {
	const result = TextGenerationNode.safeParse(args);
	return result.success;
}

export const ImageGenerationNode = OperationNode.extend({
	content: ImageGenerationContent,
});
type ImageGenerationNode = z.infer<typeof ImageGenerationNode>;

export function isImageGenerationNode(
	args?: unknown,
): args is ImageGenerationNode {
	const result = ImageGenerationNode.safeParse(args);
	return result.success;
}

export const TriggerNode = OperationNode.extend({
	content: TriggerContent,
});
export type TriggerNode = z.infer<typeof TriggerNode>;

export function isTriggerNode(args?: unknown): args is TriggerNode {
	const result = TriggerNode.safeParse(args);
	return result.success;
}

export const ActionNode = OperationNode.extend({
	content: ActionContent,
});
export type ActionNode = z.infer<typeof ActionNode>;
export function isActionNode(args?: unknown): args is ActionNode {
	const result = ActionNode.safeParse(args);
	return result.success;
}

const OverrideOperationNodeContent = z.discriminatedUnion("type", [
	OverrideTextGenerationContent,
	OverrideImageGenerationContent,
]);
export const OverrideOperationNode = OverrideNodeBase.extend({
	type: OperationNode.shape.type,
	content: OverrideOperationNodeContent,
});
export type OverrideOperationNode = z.infer<typeof OverrideOperationNode>;

const OperationNodeContentReference = z.discriminatedUnion("type", [
	TextGenerationContentReference,
	ImageGenerationContentReference,
	TriggerContentReference,
	ActionContentReference,
]);
export const OperationNodeReference = NodeReferenceBase.extend({
	type: OperationNode.shape.type,
	content: OperationNodeContentReference,
});
export type OperationNodeReference = z.infer<typeof OperationNodeReference>;
