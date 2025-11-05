import { z } from "zod/v4";

export const TextContent = z.object({
	type: z.literal("text"),
	text: z.string(),
});
export type TextContent = z.infer<typeof TextContent>;

export const CreateTextNodeParams = TextContent.omit({
	type: true,
})
	.partial()
	.extend({
		name: z.string(),
	});

export const TextContentReference = z.object({
	type: TextContent.shape.type,
});
export type TextContentReference = z.infer<typeof TextContentReference>;
