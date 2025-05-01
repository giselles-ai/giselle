import { z } from "zod";
import { Node, NodeId, OperationNode } from "../node";
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
	type: GenerationOriginTypeRun,
});
export type GenerationOriginRun = z.infer<typeof GenerationOriginRun>;

export const GenerationOrigin = z.discriminatedUnion("type", [
	GenerationOriginWorkspace,
	GenerationOriginRun,
]);
export type GenerationOrigin = z.infer<typeof GenerationOrigin>;

export const GenerationContext = z.object({
	operationNode: OperationNode,
	sourceNodes: z.array(Node),
	origin: GenerationOrigin,
});
export type GenerationContext = z.infer<typeof GenerationContext>;

export const GenerationContextLike = z.object({
	operationNode: OperationNode.extend({
		content: z.any(),
	}),
	sourceNodes: z.array(z.any()),
	origin: z.any(),
});
export type GenerationContextLike = z.infer<typeof GenerationContextLike>;
