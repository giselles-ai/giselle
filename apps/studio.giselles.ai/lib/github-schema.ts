import { z } from "zod/v4";

/**
 * GitHub chunk metadata schema and type for RAG storage
 */
export const githubChunkMetadataSchema = z.object({
	repositoryIndexDbId: z.number(),
	commitSha: z.string(),
	fileSha: z.string(),
	path: z.string(),
	nodeId: z.string(),
});

export type GitHubChunkMetadata = z.infer<typeof githubChunkMetadataSchema>;
