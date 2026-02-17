import * as z from "zod/v4";

export const EndContent = z.object({
	type: z.literal("end"),
	outputSchema: z.optional(z.string()),
});
export type EndContent = z.infer<typeof EndContent>;

export const EndContentReference = z.object({
	type: EndContent.shape.type,
});
export type EndContentReference = z.infer<typeof EndContentReference>;
