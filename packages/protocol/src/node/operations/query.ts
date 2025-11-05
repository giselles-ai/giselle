import { z } from "zod/v4";

export const DEFAULT_MAX_RESULTS = 20;
export const DEFAULT_SIMILARITY_THRESHOLD = 0.3;

export const QueryContent = z.object({
	type: z.literal("query"),
	query: z.string(),
	maxResults: z.number().int().min(1).max(100).optional(),
	similarityThreshold: z.number().min(0).max(1).optional(),
});
export type QueryContent = z.infer<typeof QueryContent>;

export const QueryContentReference = z.object({
	type: QueryContent.shape.type,
});
export type QueryContentReference = z.infer<typeof QueryContentReference>;
