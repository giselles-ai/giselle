import type { Message as AISdkMessage } from "@ai-sdk/react";

export type { Message as AISdkMessage } from "@ai-sdk/react";

import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod/v4";
import { NodeId } from "../node";
import { GenerationContextLike, GenerationOrigin } from "./context";
import { GenerationOutput } from "./output";

export * from "./context";
export * from "./output";

export const GenerationId = createIdGenerator("gnr");
export type GenerationId = z.infer<typeof GenerationId.schema>;

export const Message = z.custom<AISdkMessage>();
export type Message = z.infer<typeof Message>;

// Error schema
export const GenerationError = z.object({
	name: z.string(),
	message: z.string(),
	dump: z.any().optional(),
});

export const GenerationUsage = z.object({
	promptTokens: z.number(),
	completionTokens: z.number(),
	totalTokens: z.number(),
});
export type GenerationUsage = z.infer<typeof GenerationUsage>;

export const GenerationBase = z.object({
	id: GenerationId.schema,
	context: GenerationContextLike,
	status: z.string(),
});

// Specific schema validators for each generation status
export const CreatedGeneration = GenerationBase.extend({
	id: GenerationId.schema,
	context: GenerationContextLike,
	status: z.literal("created"),
	createdAt: z.number(),
});
export type CreatedGeneration = z.infer<typeof CreatedGeneration>;

/**
 * Type guard to check if a Generation is a CreatedGeneration
 */
export function isCreatedGeneration(
	generation: unknown,
): generation is CreatedGeneration {
	return CreatedGeneration.safeParse(generation).success;
}

export const QueuedGeneration = GenerationBase.extend({
	id: GenerationId.schema,
	context: GenerationContextLike,
	status: z.literal("queued"),
	createdAt: z.number(),
	queuedAt: z.number(),
});
export type QueuedGeneration = z.infer<typeof QueuedGeneration>;

/**
 * Type guard to check if a Generation is a QueuedGeneration
 */
export function isQueuedGeneration(data: unknown): data is QueuedGeneration {
	return QueuedGeneration.safeParse(data).success;
}

export const RunningGeneration = GenerationBase.extend({
	id: GenerationId.schema,
	context: GenerationContextLike,
	status: z.literal("running"),
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
	generation: unknown,
): generation is RunningGeneration {
	return RunningGeneration.safeParse(generation).success;
}

export const CompletedGeneration = GenerationBase.extend({
	id: GenerationId.schema,
	context: GenerationContextLike,
	status: z.literal("completed"),
	createdAt: z.number(),
	queuedAt: z.number(),
	startedAt: z.number(),
	completedAt: z.number(),
	messages: z.array(Message),
	outputs: z.array(GenerationOutput),
	usage: GenerationUsage.optional(),
});
export type CompletedGeneration = z.infer<typeof CompletedGeneration>;

/**
 * Type guard to check if a Generation is a CompletedGeneration
 */
export function isCompletedGeneration(
	generation: unknown,
): generation is CompletedGeneration {
	return CompletedGeneration.safeParse(generation).success;
}

export const FailedGeneration = GenerationBase.extend({
	id: GenerationId.schema,
	context: GenerationContextLike,
	status: z.literal("failed"),
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
	generation: unknown,
): generation is FailedGeneration {
	return FailedGeneration.safeParse(generation).success;
}

export const CancelledGeneration = GenerationBase.extend({
	id: GenerationId.schema,
	context: GenerationContextLike,
	status: z.literal("cancelled"),
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
	data: unknown,
): data is CancelledGeneration {
	return CancelledGeneration.safeParse(data).success;
}

/**
 * Unified Generation schema with conditional validation based on status
 */
export const Generation = z.discriminatedUnion("status", [
	CreatedGeneration,
	QueuedGeneration,
	RunningGeneration,
	CompletedGeneration,
	FailedGeneration,
	CancelledGeneration,
]);

// Export the Generation type
export type Generation = z.infer<typeof Generation>;

export const GenerationStatus = z.union(
	Generation.options.map((option) => option.shape.status),
);
export type GenerationStatus = z.infer<typeof GenerationStatus>;

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
