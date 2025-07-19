import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod/v4";
import { Connection } from "../connection";
import { Node, NodeLike, OperationNode } from "../node";

export const SequenceId = createIdGenerator("jb");
export type SequenceId = z.infer<typeof SequenceId.schema>;
export const WorkflowId = createIdGenerator("wf");
export type WorkflowId = z.infer<typeof WorkflowId.schema>;

export const Step = z.object({
	node: OperationNode,
	sourceNodes: z.array(Node),
	connections: z.array(Connection),
});
export type Step = z.infer<typeof Step>;

export const Sequence = z.object({
	id: SequenceId.schema,
	workflowId: WorkflowId.schema,
	steps: z.array(Step),
});
export type Sequence = z.infer<typeof Sequence>;

export const Workflow = z.object({
	id: WorkflowId.schema,
	sequences: z.array(Sequence),
	nodes: z.array(NodeLike),
});
export type Workflow = z.infer<typeof Workflow>;
