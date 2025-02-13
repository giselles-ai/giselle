import { createIdGenerator } from "@/lib/utils/generate-id";
import { z } from "zod";
import { ActionNodeData } from "./node/actions";
import { Connection, connectionId, nodeId } from "./node/types";
import { VariableNodeData } from "./node/variables";

const NodeData = z.discriminatedUnion("type", [
	ActionNodeData,
	VariableNodeData,
]);
export type NodeData = z.infer<typeof NodeData>;
export const workflowId = createIdGenerator("wf");
export type WorkflowId = z.infer<typeof workflowId.schema>;

export const WorkflowData = z.object({
	id: workflowId.schema,
	nodes: z.preprocess(
		(args) => {
			if (typeof args !== "object" || args === null || args instanceof Map) {
				return args;
			}
			return new Map(Object.entries(args));
		},
		z.map(nodeId.schema, NodeData),
	),
	connections: z.preprocess(
		(args) => {
			if (typeof args !== "object" || args === null || args instanceof Map) {
				return args;
			}
			return new Map(Object.entries(args));
		},
		z.map(connectionId.schema, Connection),
	),
});
export type WorkflowData = z.infer<typeof WorkflowData>;
export const WorkflowDataJson = WorkflowData.extend({
	nodes: z.preprocess(
		(args) => {
			if (args instanceof Map) {
				return Object.fromEntries(args);
			}
			return args;
		},
		z.record(nodeId.schema, NodeData),
	),
	connections: z.preprocess(
		(args) => {
			if (args instanceof Map) {
				return Object.fromEntries(args);
			}
			return args;
		},
		z.record(connectionId.schema, Connection),
	),
});
export type WorkflowDataJson = z.infer<typeof WorkflowDataJson>;

export function generateInitialWorkflowData() {
	return WorkflowData.parse({
		id: workflowId.generate(),
		nodes: new Map(),
		connections: new Map(),
	});
}
