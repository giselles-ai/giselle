import { createIdGenerator } from "@giselles-ai/utils";
import * as z from "zod/v4";
import { AppId } from "../app";
import { GenerationStatus } from "../generation";
import { GenerationId } from "../generation/generation-id";
import { NodeId } from "../node";
import { TriggerId } from "../trigger";
import { WorkspaceId } from "../workspace";
import { TaskId } from "./task-id";

export const SequenceId = createIdGenerator("sqn");
export type SequenceId = z.infer<typeof SequenceId.schema>;

export const StepId = createIdGenerator("stp");
export type StepId = z.infer<typeof StepId.schema>;

const ActAnnotationObject = z.object({
	level: z.enum(["info", "warning", "error"]),
	message: z.string(),
	sequenceId: SequenceId.schema,
	stepId: StepId.schema,
});

export const Step = z.object({
	id: StepId.schema,
	status: GenerationStatus,
	name: z.string(),
	generationId: GenerationId.schema,
	duration: z.number(),
	usage: z.object({
		inputTokens: z.number(),
		outputTokens: z.number(),
		totalTokens: z.number(),
	}),
});
export type Step = z.infer<typeof Step>;

export const Sequence = z.object({
	id: SequenceId.schema,
	steps: z.array(Step),
	status: GenerationStatus,
	duration: z.object({
		wallClock: z.number(),
		totalTask: z.number(),
	}),
	usage: z.object({
		inputTokens: z.number(),
		outputTokens: z.number(),
		totalTokens: z.number(),
	}),
});
export type Sequence = z.infer<typeof Sequence>;

const TaskStarter = z.union([
	z.object({
		type: z.literal("run-button"),
	}),
	z.object({
		type: z.literal("github-trigger"),
		triggerId: TriggerId.schema,
		end: z.union([
			z.object({ type: "endNode", appId: AppId.schema }),
			z.object({ type: "none" }),
		]),
	}),
	z.object({
		type: z.literal("app"),
		appId: AppId.schema,
	}),
]);
export type TaskStarter = z.infer<typeof TaskStarter>;

export const Task = z.object({
	id: TaskId.schema,
	starter: TaskStarter,
	workspaceId: WorkspaceId.schema,
	name: z.string(),
	status: z.enum(["created", "inProgress", "completed", "failed", "cancelled"]),
	steps: z.object({
		queued: z.number(),
		inProgress: z.number(),
		completed: z.number(),
		warning: z.number(),
		cancelled: z.number(),
		failed: z.number(),
	}),
	trigger: z.string(),
	duration: z.object({
		wallClock: z.number(),
		totalTask: z.number(),
	}),
	usage: z.object({
		inputTokens: z.number(),
		outputTokens: z.number(),
		totalTokens: z.number(),
	}),
	createdAt: z.number(),
	updatedAt: z.number(),
	annotations: z.array(ActAnnotationObject).default([]),
	sequences: z.array(Sequence),
	nodeIdsConnectedToEnd: z.array(NodeId.schema).optional(),
});
export type Task = z.infer<typeof Task>;

export const TaskIndexObject = Task.pick({
	id: true,
	workspaceId: true,
});
