import { z } from "zod/v4";

export const documentVectorStoreMetadataSchema = z.object({
	documentVectorStoreSourceDbId: z.number(),
	documentKey: z.string(),
});

export type DocumentVectorStoreMetadata = z.infer<
	typeof documentVectorStoreMetadataSchema
>;
