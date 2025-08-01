import { WorkspaceId } from "@giselle-sdk/data-type";
import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod/v4";
import { GenerationStatus } from "./generation";
import { ActId, GenerationId, StepId } from "./identifiers";

// Re-export ActId from identifiers
export { ActId } from "./identifiers";
export const SequenceId = createIdGenerator("sqn");

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

export const Act = z.object({
	id: ActId.schema,
	workspaceId: WorkspaceId.schema,
	name: z.string(),
	status: z.enum(["inProgress", "completed", "failed", "cancelled"]),
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
});
export type Act = z.infer<typeof Act>;

export const ActIndexObject = Act.pick({
	id: true,
	workspaceId: true,
});
