import {
	Connection,
	Node,
	NodeLike,
	OperationNode,
	OperationNodeLike,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import type { WebhookEvent } from "@giselle-sdk/github-tool";
import { z } from "zod/v4";
import { ActId } from "../identifiers";

export const GenerationOriginStudio = z.object({
	actId: z.optional(ActId.schema),
	workspaceId: WorkspaceId.schema,
	type: z.literal("studio"),
});
export type GenerationOriginStudio = z.infer<typeof GenerationOriginStudio>;

export const GenerationOriginStage = z.object({
	actId: ActId.schema,
	workspaceId: WorkspaceId.schema,
	type: z.literal("stage"),
});
export type GenerationOriginStage = z.infer<typeof GenerationOriginStage>;

export const GenerationOriginGitHubApp = z.object({
	actId: ActId.schema,
	workspaceId: WorkspaceId.schema,
	type: z.literal("github-app"),
});
export type GenerationOriginGitHubApp = z.infer<
	typeof GenerationOriginGitHubApp
>;

export const GenerationOrigin = z.discriminatedUnion("type", [
	GenerationOriginStudio,
	GenerationOriginStage,
	GenerationOriginGitHubApp,
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
	operationNode: OperationNode,
	connections: z.array(Connection).default([]),
	sourceNodes: z.array(Node),
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
	operationNode: OperationNodeLike,
	sourceNodes: z.array(NodeLike),
	connections: z.array(z.any()).default([]),
	origin: GenerationOrigin,
	inputs: z.array(GenerationContextInput).optional(),
});
export type GenerationContextLike = z.infer<typeof GenerationContextLike>;
