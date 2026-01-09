import { createIdGenerator } from "@giselles-ai/utils";
import * as z from "zod/v4";
import { PostgresDataStoreConfig } from "./postgres";

export { PostgresDataStoreConfig } from "./postgres";

export const DataStoreId = createIdGenerator("ds");
export type DataStoreId = z.infer<typeof DataStoreId.schema>;

export const DataStoreConfig = z.discriminatedUnion("provider", [
	PostgresDataStoreConfig,
]);
export type DataStoreConfig = z.infer<typeof DataStoreConfig>;
