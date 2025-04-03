import type { Message as AISdkMessage } from "@ai-sdk/react";
export type { Message as AISdkMessage } from "@ai-sdk/react";
import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod";
import { NodeId } from "../node";
import { GenerationContext, GenerationOrigin } from "./context";
import { GenerationOutput } from "./output";
export * from "./context";
export * from "./template";
export * from "./output";

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

// Generation status constants
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

// Error schema
export const GenerationError = z.object({
	name: z.string(),
	message: z.string(),
	dump: z.any(),
});

/**
 * Unified Generation schema with conditional validation based on status
 */
export const Generation = z
	.object({
		// Common fields for all generations
		id: GenerationId.schema,
		context: GenerationContext,
		status: GenerationStatus,
		createdAt: z.number(),

		// Optional timing fields
		queuedAt: z.number().optional(),
		startedAt: z.number().optional(),
		completedAt: z.number().optional(),
		failedAt: z.number().optional(),
		cancelledAt: z.number().optional(),

		// Optional content fields
		messages: z.array(Message).optional().or(z.undefined()),
		outputs: z.array(GenerationOutput).optional(),
		error: GenerationError.optional(),
	})
	.refine(
		(data) => {
			// Required fields based on status
			switch (data.status) {
				case "created":
					return data.messages === undefined;
				case "queued":
					return data.queuedAt !== undefined && data.messages === undefined;
				case "running":
					return (
						data.queuedAt !== undefined &&
						data.startedAt !== undefined &&
						Array.isArray(data.messages)
					);
				case "completed":
					return (
						data.queuedAt !== undefined &&
						data.startedAt !== undefined &&
						data.completedAt !== undefined &&
						Array.isArray(data.messages) &&
						Array.isArray(data.outputs)
					);
				case "failed":
					return (
						data.queuedAt !== undefined &&
						data.startedAt !== undefined &&
						data.failedAt !== undefined &&
						data.error !== undefined &&
						Array.isArray(data.messages)
					);
				case "cancelled":
					return data.cancelledAt !== undefined;
				default:
					return false;
			}
		},
		{
			message:
				"Generation fields don't match required fields for the specified status",
			path: ["status"],
		},
	);

// Export the Generation type
export type Generation = z.infer<typeof Generation>;

// Specific schema validators for each generation status
export const CreatedGeneration = z.object({
	id: GenerationId.schema,
	context: GenerationContext,
	status: GenerationStatusCreated,
	createdAt: z.number(),
	messages: z.undefined(),
});
export type CreatedGeneration = z.infer<typeof CreatedGeneration>;

/**
 * Type guard to check if a Generation is a CreatedGeneration
 */
export function isCreatedGeneration(
	generation: Generation,
): generation is CreatedGeneration {
	return CreatedGeneration.safeParse(generation).success;
}

export const QueuedGeneration = z.object({
	id: GenerationId.schema,
	context: GenerationContext,
	status: GenerationStatusQueued,
	createdAt: z.number(),
	queuedAt: z.number(),
	messages: z.undefined(),
});
export type QueuedGeneration = z.infer<typeof QueuedGeneration>;

/**
 * Type guard to check if a Generation is a QueuedGeneration
 */
export function isQueuedGeneration(
	generation: Generation,
): generation is QueuedGeneration {
	return QueuedGeneration.safeParse(generation).success;
}

export const RunningGeneration = z.object({
	id: GenerationId.schema,
	context: GenerationContext,
	status: GenerationStatusRunning,
	createdAt: z.number(),
	queuedAt: z.number(),
	startedAt: z.number(),
	messages: z.array(Message),
});
export type RunningGeneration = z.infer<typeof RunningGeneration>;

/**
 * Type guard to check if a Generation is a RunningGeneration
 */
export function isRunningGeneration(
	generation: Generation,
): generation is RunningGeneration {
	return RunningGeneration.safeParse(generation).success;
}

export const CompletedGeneration = z.object({
	id: GenerationId.schema,
	context: GenerationContext,
	status: GenerationStatusCompleted,
	createdAt: z.number(),
	queuedAt: z.number(),
	startedAt: z.number(),
	completedAt: z.number(),
	messages: z.array(Message),
	outputs: z.array(GenerationOutput),
});
export type CompletedGeneration = z.infer<typeof CompletedGeneration>;

/**
 * Type guard to check if a Generation is a CompletedGeneration
 */
export function isCompletedGeneration(
	generation: Generation,
): generation is CompletedGeneration {
	return CompletedGeneration.safeParse(generation).success;
}

export const FailedGeneration = z.object({
	id: GenerationId.schema,
	context: GenerationContext,
	status: GenerationStatusFailed,
	createdAt: z.number(),
	queuedAt: z.number(),
	startedAt: z.number(),
	failedAt: z.number(),
	messages: z.array(Message),
	error: GenerationError,
});
export type FailedGeneration = z.infer<typeof FailedGeneration>;

/**
 * Type guard to check if a Generation is a FailedGeneration
 */
export function isFailedGeneration(
	generation: Generation,
): generation is FailedGeneration {
	return FailedGeneration.safeParse(generation).success;
}

export const CancelledGeneration = z.object({
	id: GenerationId.schema,
	context: GenerationContext,
	status: GenerationStatusCancelled,
	createdAt: z.number(),
	cancelledAt: z.number(),
	messages: z.array(Message).optional(),
	queuedAt: z.number().optional(),
	startedAt: z.number().optional(),
});
export type CancelledGeneration = z.infer<typeof CancelledGeneration>;

/**
 * Type guard to check if a Generation is a CancelledGeneration
 */
export function isCancelledGeneration(
	generation: Generation,
): generation is CancelledGeneration {
	return CancelledGeneration.safeParse(generation).success;
}

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
	queuedAt: z.number().optional(),
	startedAt: z.number().optional(),
	completedAt: z.number().optional(),
	failedAt: z.number().optional(),
	cancelledAt: z.number().optional(),
});
export type NodeGenerationIndex = z.infer<typeof NodeGenerationIndex>;
