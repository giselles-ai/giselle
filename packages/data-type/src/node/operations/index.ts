import type { ActionProvider, TriggerProvider } from "@giselle-sdk/flow";
import { z } from "zod/v4";
import { NodeBase, NodeReferenceBase } from "../base";
import { ActionContent, ActionContentReference } from "./action";
import {
	ImageGenerationContent,
	ImageGenerationContentReference,
} from "./image-generation";
import { QueryContent, QueryContentReference } from "./query";
import {
	TextGenerationContent,
	TextGenerationContentReference,
} from "./text-generation";
import { TriggerContent, TriggerContentReference } from "./trigger";

export * from "./action";
export * from "./image-generation";
export * from "./query";
export * from "./text-generation";
export * from "./trigger";

const OperationNodeContent = z.discriminatedUnion("type", [
	TextGenerationContent,
	ImageGenerationContent,
	TriggerContent,
	ActionContent,
	QueryContent,
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
			QueryContent.shape.type,
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

export function isTriggerNode<
	TTriggerProvider extends TriggerProvider = TriggerProvider,
>(
	args?: unknown,
	provider?: TTriggerProvider,
): args is TTriggerProvider extends TriggerProvider
	? TriggerNode & { content: { provider: TTriggerProvider } }
	: TriggerNode {
	const result = TriggerNode.safeParse(args);
	return (
		result.success &&
		(provider === undefined || result.data.content.provider === provider)
	);
}

export const ActionNode = OperationNode.extend({
	content: ActionContent,
});
export type ActionNode = z.infer<typeof ActionNode>;
export function isActionNode<
	TActionProvider extends ActionProvider = ActionProvider,
>(
	args?: unknown,
	provider?: TActionProvider,
): args is TActionProvider extends ActionProvider
	? ActionNode & { content: { command: { provider: TActionProvider } } }
	: ActionNode {
	const result = ActionNode.safeParse(args);
	return (
		result.success &&
		(provider === undefined ||
			result.data.content.command.provider === provider)
	);
}

export const QueryNode = OperationNode.extend({
	content: QueryContent,
});
export type QueryNode = z.infer<typeof QueryNode>;
export function isQueryNode(args?: unknown): args is QueryNode {
	const result = QueryNode.safeParse(args);
	return result.success;
}

const OperationNodeContentReference = z.discriminatedUnion("type", [
	TextGenerationContentReference,
	ImageGenerationContentReference,
	TriggerContentReference,
	ActionContentReference,
	QueryContentReference,
]);
export const OperationNodeReference = NodeReferenceBase.extend({
	type: OperationNode.shape.type,
	content: OperationNodeContentReference,
});
export type OperationNodeReference = z.infer<typeof OperationNodeReference>;
