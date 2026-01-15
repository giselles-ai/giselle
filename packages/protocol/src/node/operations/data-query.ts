import * as z from "zod/v4";

export const DataQueryContent = z.object({
	type: z.literal("dataQuery"),
	query: z.string(),
});
export type DataQueryContent = z.infer<typeof DataQueryContent>;

export const DataQueryContentReference = z.object({
	type: DataQueryContent.shape.type,
});
export type DataQueryContentReference = z.infer<
	typeof DataQueryContentReference
>;
