import { z } from "zod";
import {
	OperationNode,
	OperationNodeReference,
	OverrideOperationNode,
} from "./operations";
import {
	OverrideVariableNode,
	VariableNode,
	VariableNodeReference,
} from "./variables";
export * from "./operations";
export * from "./variables";
export * from "./base";

export const Node = z.discriminatedUnion("type", [OperationNode, VariableNode]);
export type Node = z.infer<typeof Node>;

export const OverrideNode = z.discriminatedUnion("type", [
	OverrideOperationNode,
	OverrideVariableNode,
]);
export type OverrideNode = z.infer<typeof OverrideNode>;

export const NodeReference = z.discriminatedUnion("type", [
	OperationNodeReference,
	VariableNodeReference,
]);
export type NodeReference = z.infer<typeof NodeReference>;
