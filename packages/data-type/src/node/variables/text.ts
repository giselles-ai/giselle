import { z } from "zod/v4";

export const TextContent = z.object({
	type: z.literal("text"),
	text: z.string(),
});
type TextContent = z.infer<typeof TextContent>;

export const CreateTextNodeParams = TextContent.omit({
	type: true,
})
	.partial()
	.extend({
		name: z.string(),
	});

export const OverrideTextContent = z.object({
	type: z.literal("text"),
	text: z.string(),
});
export type OverrideTextContent = z.infer<typeof OverrideTextContent>;

export function isOverrideTextContent(
	content: unknown,
): content is OverrideTextContent {
	return OverrideTextContent.safeParse(content).success;
}

export const TextContentReference = z.object({
	type: TextContent.shape.type,
});
export type TextContentReference = z.infer<typeof TextContentReference>;
