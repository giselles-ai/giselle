import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod";
import { Workflow } from "../workflow";
import { WorkspaceId } from "../workspace";

export const RunId = createIdGenerator("rn");
export type RunId = z.infer<typeof RunId.schema>;

export const RunBase = z.object({
	id: RunId.schema,
});
export type RunBase = z.infer<typeof RunBase>;

export const CreatedRun = RunBase.extend({
	status: z.literal("created"),
	createdAt: z.number(),
});
export type CreatedRun = z.infer<typeof CreatedRun>;

export const QueuedRun = RunBase.extend({
	status: z.literal("queued"),
	createdAt: z.number(),
	workspaceId: WorkspaceId.schema,
	workflow: Workflow,
	queuedAt: z.number(),
});
export type QueuedRun = z.infer<typeof QueuedRun>;

export const RunningRun = RunBase.extend({
	status: z.literal("running"),
	createdAt: z.number(),
	workspaceId: WorkspaceId.schema,
	workflow: Workflow,
	queuedAt: z.number(),
	startedAt: z.number(),
});
export type RunningRun = z.infer<typeof RunningRun>;

export const CompletedRun = RunBase.extend({
	status: z.literal("completed"),
	createdAt: z.number(),
	workspaceId: WorkspaceId.schema,
	workflow: Workflow,
	queuedAt: z.number(),
	startedAt: z.number(),
	completedAt: z.number(),
});
export type CompletedRun = z.infer<typeof CompletedRun>;

export const CancelledRun = RunBase.extend({
	status: z.literal("cancelled"),
	createdAt: z.number(),
	workspaceId: WorkspaceId.schema,
	workflow: Workflow,
	queuedAt: z.number().optional(),
	startedAt: z.number().optional(),
	cancelledAt: z.number(),
});
export type CancelledRun = z.infer<typeof CancelledRun>;

export const Run = z.discriminatedUnion("status", [
	CreatedRun,
	QueuedRun,
	RunningRun,
	CompletedRun,
	CancelledRun,
]);
export type Run = z.infer<typeof Run>;
