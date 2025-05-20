import { z } from "zod";
import { Connection } from "../connection";
import { Node, NodeBase, NodeId, OperationNode } from "../node";
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

export const GenerationInput = z.object({
	name: z.string(),
	value: z.string(),
});
export type GenerationInput = z.infer<typeof GenerationInput>;

export const GenerationContext = z.object({
	operationNode: OperationNode,
	connections: z.array(Connection).default([]),
	sourceNodes: z.array(Node),
	origin: GenerationOrigin,
	inputs: z
		.array(GenerationInput)
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
	origin: z.any(),
	inputs: z.array(GenerationInput).optional(),
});
export type GenerationContextLike = z.infer<typeof GenerationContextLike>;
