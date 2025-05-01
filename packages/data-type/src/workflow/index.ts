import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod";
import { GenerationTemplate } from "../generation/template";
import { Node } from "../node";

export const JobId = createIdGenerator("jb");
export type JobId = z.infer<typeof JobId.schema>;
export const WorkflowId = createIdGenerator("wf");
export type WorkflowId = z.infer<typeof WorkflowId.schema>;

export const Operation = z.object({
	node: Node,
	generationTemplate: GenerationTemplate,
});
export type Operation = z.infer<typeof Operation>;

export const Job = z.object({
	id: JobId.schema,
	workflowId: WorkflowId.schema,
	operations: z.array(Operation),
});
export type Job = z.infer<typeof Job>;

export const Workflow = z.object({
	id: WorkflowId.schema,
	jobs: z.array(Job),
	nodes: z.array(Node),
});
export type Workflow = z.infer<typeof Workflow>;
