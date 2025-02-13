import { createIdGenerator } from "@/lib/utils/generate-id";
import { z } from "zod";

export const nodeId = createIdGenerator("nd");
export type NodeId = z.infer<typeof nodeId.schema>;

export const BaseNodeData = z.object({
	id: nodeId.schema,
	name: z.string(),
	type: z.string(),
});
export type BaseNodeData = z.infer<typeof BaseNodeData>;

export const connectionHandleId = createIdGenerator("hndl");
export type ConnectionHandleId = z.infer<typeof connectionHandleId.schema>;

export const Position = z.object({
	x: z.number(),
	y: z.number(),
});

export const ConnectionHandle = z.object({
	id: connectionHandleId.schema,
	nodeId: nodeId.schema,
	nodeType: BaseNodeData.shape.type,
	label: z.string(),
});
export type ConnectionHandle = z.infer<typeof ConnectionHandle>;

export const NodeUIState = z.object({
	position: Position,
	selected: z.boolean(),
});

export const connectionId = createIdGenerator("cnnc");
export const Connection = z.object({
	id: connectionId.schema,
	sourceNodeId: nodeId.schema,
	sourceNodeType: BaseNodeData.shape.type,
	targetNodeId: nodeId.schema,
	targetNodeType: BaseNodeData.shape.type,
	targetNodeHandleId: connectionHandleId.schema,
});
export type Connection = z.infer<typeof Connection>;
