import { z } from "zod";
import { ActionNode, ActionNodeReference } from "./actions";
import { VariableNode, VariableNodeReference } from "./variables";
export * from "./actions";
export * from "./variables";
export * from "./base";

export const Node = z.discriminatedUnion("type", [ActionNode, VariableNode]);
export type Node = z.infer<typeof Node>;

export const NodeReference = z.discriminatedUnion("type", [
	ActionNodeReference,
	VariableNodeReference,
]);
export type NodeReference = z.infer<typeof NodeReference>;
