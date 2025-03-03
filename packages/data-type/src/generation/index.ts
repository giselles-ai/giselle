import { createIdGenerator } from "@giselle-sdk/utils";
import type { Message as AISdkMessage } from "ai";
import { z } from "zod";
import { NodeId } from "../node";
import { GenerationContext, GenerationOrigin } from "./context";
export * from "./context";
export * from "./template";

export const GenerationId = createIdGenerator("gnr");
export type GenerationId = z.infer<typeof GenerationId.schema>;

export const GenerationTypeWorkspace = z.literal("workspace");
export type GenerationTypeWorkspace = z.infer<typeof GenerationTypeWorkspace>;
export const GenerationTypeRun = z.literal("run");
export type GenerationTypeRun = z.infer<typeof GenerationTypeRun>;
export const GenerationType = z.union([
	GenerationTypeWorkspace,
	GenerationTypeRun,
]);
export type GenerationType = z.infer<typeof GenerationType>;
export const Message = z.custom<AISdkMessage>();
export type Message = z.infer<typeof Message>;

export const GenerationStatusCreated = z.literal("created");
export type GenerationStatusCreated = z.infer<typeof GenerationStatusCreated>;
export const GenerationStatusQueued = z.literal("queued");
export type GenerationStatusQueued = z.infer<typeof GenerationStatusQueued>;
export const GenerationStatusRunning = z.literal("running");
export type GenerationStatusRunning = z.infer<typeof GenerationStatusRunning>;
export const GenerationStatusCompleted = z.literal("completed");
export type GenerationStatusCompleted = z.infer<
	typeof GenerationStatusCompleted
>;

export const GenerationStatusFailed = z.literal("failed");
export type GenerationStatusFailed = z.infer<typeof GenerationStatusFailed>;
export const GenerationStatusCancelled = z.literal("cancelled");
export type GenerationStatusCancelled = z.infer<
	typeof GenerationStatusCancelled
>;

export const GenerationStatus = z.union([
	GenerationStatusCreated,
	GenerationStatusQueued,
	GenerationStatusRunning,
	GenerationStatusCompleted,
	GenerationStatusFailed,
	GenerationStatusCancelled,
]);

export const GenerationBase = z.object({
	id: GenerationId.schema,
	context: GenerationContext,
	status: GenerationStatus,
});

export const CreatedGeneration = GenerationBase.extend({
	status: GenerationStatusCreated,
	createdAt: z.number(),
	messages: z.undefined(),
});
export type CreatedGeneration = z.infer<typeof CreatedGeneration>;

export const QueuedGeneration = GenerationBase.extend({
	status: GenerationStatusQueued,
	createdAt: z.number(),
	messages: z.undefined(),
	ququedAt: z.number(),
});
export type QueuedGeneration = z.infer<typeof QueuedGeneration>;

export const RunningGeneration = GenerationBase.extend({
	status: GenerationStatusRunning,
	createdAt: z.number(),
	messages: z.array(Message),
	ququedAt: z.number(),
	requestedAt: z.number(),
	startedAt: z.number(),
});
export type RunningGeneration = z.infer<typeof RunningGeneration>;

export const CompletedGeneration = GenerationBase.extend({
	status: GenerationStatusCompleted,
	createdAt: z.number(),
	messages: z.array(Message),
	ququedAt: z.number(),
	requestedAt: z.number(),
	startedAt: z.number(),
	completedAt: z.number(),
});
export type CompletedGeneration = z.infer<typeof CompletedGeneration>;

export const FailedGeneration = GenerationBase.extend({
	status: GenerationStatusFailed,
	createdAt: z.number(),
	messages: z.array(Message),
	ququedAt: z.number(),
	requestedAt: z.number(),
	startedAt: z.number(),
	failedAt: z.number(),
	error: z.object({
		name: z.string(),
		message: z.string(),
		dump: z.any(),
	}),
});
export type FailedGeneration = z.infer<typeof FailedGeneration>;

export const CancelledGeneration = GenerationBase.extend({
	status: GenerationStatusCancelled,
	createdAt: z.number(),
	messages: z.array(Message).optional(),
	queuedAt: z.number().optional(),
	requestedAt: z.number().optional(),
	startedAt: z.number().optional(),
	cancelledAt: z.number(),
});
export type CancelledGeneration = z.infer<typeof CancelledGeneration>;

export const Generation = z.discriminatedUnion("status", [
	CreatedGeneration,
	QueuedGeneration,
	RunningGeneration,
	CompletedGeneration,
	FailedGeneration,
	CancelledGeneration,
]);
export type Generation = z.infer<typeof Generation>;

export const GenerationIndex = z.object({
	id: GenerationId.schema,
	origin: GenerationOrigin,
});
export type GenerationIndex = z.infer<typeof GenerationIndex>;

export const NodeGenerationIndex = z.object({
	id: GenerationId.schema,
	nodeId: NodeId.schema,
	status: GenerationStatus,
	createdAt: z.number(),
	/** @todo fix typo */
	ququedAt: z.number(),
	requestedAt: z.number().optional(),
	startedAt: z.number().optional(),
	completedAt: z.number().optional(),
	failedAt: z.number().optional(),
	cancelledAt: z.number().optional(),
});
export type NodeGenerationIndex = z.infer<typeof NodeGenerationIndex>;
