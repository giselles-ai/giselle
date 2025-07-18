import { z } from "zod/v4";

/**
 * GitHub chunk metadata schema and type for RAG storage
 */
export const githubChunkMetadataSchema = z.object({
	repositoryIndexDbId: z.number(),
	fileSha: z.string(),
	path: z.string(),
});

/**
 * Query metadata schema for GitHub queries
 */
export const githubQueryMetadataSchema = z.object({
	fileSha: z.string(),
	path: z.string(),
});
