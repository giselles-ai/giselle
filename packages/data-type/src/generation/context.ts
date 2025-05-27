import type { WebhookEvent } from "@giselle-sdk/github-tool";
import { z } from "zod/v4";
import { Connection } from "../connection";
import { NodeBase, NodeLike, OperationNodeLike } from "../node";
import { RunId } from "../run";
import { WorkspaceId } from "../workspace";

export const GenerationOriginTypeWorkspace = z.literal("workspace");
export type GenerationOriginTypeWorkspace = z.infer<
	typeof GenerationOriginTypeWorkspace
>;

export const GenerationOriginTypeRun = z.literal("run");
export type GenerationOriginTypeRun = z.infer<typeof GenerationOriginTypeRun>;

export const GenerationOriginType = z.union([
	GenerationOriginTypeWorkspace,
	GenerationOriginTypeRun,
]);
export type GenerationOriginType = z.infer<typeof GenerationOriginType>;

export const GenerationOriginWorkspace = z.object({
	id: WorkspaceId.schema,
	type: GenerationOriginTypeWorkspace,
});
export type GenerationOriginWorkspace = z.infer<
	typeof GenerationOriginWorkspace
>;

export const GenerationOriginRun = z.object({
	id: RunId.schema,
	workspaceId: WorkspaceId.schema,
	type: GenerationOriginTypeRun,
});
export type GenerationOriginRun = z.infer<typeof GenerationOriginRun>;

export const GenerationOrigin = z.discriminatedUnion("type", [
	GenerationOriginWorkspace,
	GenerationOriginRun,
]);
export type GenerationOrigin = z.infer<typeof GenerationOrigin>;

export const StringParameterItem = z.object({
	name: z.string(),
	type: z.literal("string"),
	value: z.string(),
});
export type StringParameterItem = z.infer<typeof StringParameterItem>;

export const NumberParameterItem = z.object({
	name: z.string(),
	type: z.literal("number"),
	value: z.number(),
});
export type NumberParameterItem = z.infer<typeof NumberParameterItem>;

export const ParameterItem = z.discriminatedUnion("type", [
	StringParameterItem,
	NumberParameterItem,
]);
export type ParameterItem = z.infer<typeof ParameterItem>;

export const ParametersInput = z.object({
	type: z.literal("parameters"),
	items: z.array(ParameterItem),
});
export type ParametersInput = z.infer<typeof ParametersInput>;

export const GitHubWebhookEventInput = z.object({
	type: z.literal("github-webhook-event"),
	webhookEvent: z.custom<WebhookEvent>(),
});
export type GitHubWebhookEventInput = z.infer<typeof GitHubWebhookEventInput>;

export const GenerationContextInput = z.discriminatedUnion("type", [
	ParametersInput,
	GitHubWebhookEventInput,
]);
export type GenerationContextInput = z.infer<typeof GenerationContextInput>;

export const GenerationContext = z.object({
	operationNode: OperationNodeLike,
	connections: z.array(Connection).default([]),
	sourceNodes: z.array(NodeLike),
	origin: GenerationOrigin,
	inputs: z
		.array(GenerationContextInput)
		.optional()
		.describe(
			"Inputs from node connections are represented in sourceNodes, while this represents inputs from the external environment. Mainly used with Trigger nodes.",
		),
});
export type GenerationContext = z.infer<typeof GenerationContext>;

export const GenerationContextLike = z.object({
	operationNode: NodeBase.extend({
		type: z.literal("operation"),
		content: z.any(),
	}),
	sourceNodes: z.array(z.any()),
	connections: z.array(z.any()).default([]),
	origin: GenerationOrigin,
	inputs: z.array(GenerationContextInput).optional(),
});
export type GenerationContextLike = z.infer<typeof GenerationContextLike>;
