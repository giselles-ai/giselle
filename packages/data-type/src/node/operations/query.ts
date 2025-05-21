import { z } from "zod/v4";

export const QueryContent = z.object({
	type: z.literal("query"),
	query: z.string(),
});
export type QueryContent = z.infer<typeof QueryContent>;

export const OverrideQueryContent = z.object({
	type: z.literal("query"),
	query: z.string(),
});
export type OverrideQueryContent = z.infer<typeof OverrideQueryContent>;

export function isOverrideQueryContent(
	content: unknown,
): content is OverrideQueryContent {
	return OverrideQueryContent.safeParse(content).success;
}

export const QueryContentReference = z.object({
	type: QueryContent.shape.type,
});
export type QueryContentReference = z.infer<typeof QueryContentReference>;
