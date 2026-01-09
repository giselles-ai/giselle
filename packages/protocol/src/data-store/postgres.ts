import * as z from "zod/v4";

export const PostgresDataStoreConfig = z.object({
	provider: z.literal("postgres"),
	connectionString: z.string(),
});
export type PostgresDataStoreConfig = z.infer<typeof PostgresDataStoreConfig>;
