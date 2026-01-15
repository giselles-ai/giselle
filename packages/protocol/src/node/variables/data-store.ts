import * as z from "zod/v4";
import { DataStoreId } from "../../data-store";

export const DataStoreState = z.discriminatedUnion("status", [
	z.object({
		status: z.literal("configured"),
		dataStoreId: DataStoreId.schema,
	}),
	z.object({
		status: z.literal("unconfigured"),
	}),
]);
export type DataStoreState = z.infer<typeof DataStoreState>;

export const DataStoreContent = z.object({
	type: z.literal("dataStore"),
	state: DataStoreState,
});
export type DataStoreContent = z.infer<typeof DataStoreContent>;

export const DataStoreContentReference = z.object({
	type: DataStoreContent.shape.type,
});
export type DataStoreContentReference = z.infer<
	typeof DataStoreContentReference
>;
