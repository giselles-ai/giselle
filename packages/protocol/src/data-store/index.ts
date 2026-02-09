import {
	type DataStoreProvider,
	isDataStoreProvider,
} from "@giselles-ai/data-store-registry";
import { createIdGenerator } from "@giselles-ai/utils";
import * as z from "zod/v4";

export const DataStoreId = createIdGenerator("ds");
export type DataStoreId = z.infer<typeof DataStoreId.schema>;

export const DataStore = z.object({
	id: DataStoreId.schema,
	provider: z.custom<DataStoreProvider>((v) => isDataStoreProvider(v)),
	configuration: z.record(z.string(), z.unknown()),
});
export type DataStore = z.infer<typeof DataStore>;
