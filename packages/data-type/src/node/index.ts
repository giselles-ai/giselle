import { z } from "zod/v4";
import {
	OperationNode,
	OperationNodeLike,
	OperationNodeReference,
} from "./operations";
import {
	VariableNode,
	VariableNodeLike,
	VariableNodeReference,
} from "./variables";

export * from "./base";
export * from "./operations";
export * from "./variables";

export const Node = z.discriminatedUnion("type", [OperationNode, VariableNode]);
export type Node = z.infer<typeof Node>;

export const NodeLike = z.discriminatedUnion("type", [
	OperationNodeLike,
	VariableNodeLike,
]);
export type NodeLike = z.infer<typeof NodeLike>;

export const NodeReference = z.discriminatedUnion("type", [
	OperationNodeReference,
	VariableNodeReference,
]);
export type NodeReference = z.infer<typeof NodeReference>;
