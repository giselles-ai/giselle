import { z } from "zod/v4";

/**
 * GitHub Blob metadata schema and type
 */
export const gitHubBlobMetadataSchema = z.object({
	repositoryIndexDbId: z.number(),
	commitSha: z.string(),
	fileSha: z.string(),
	path: z.string(),
	nodeId: z.string(),
});

export type GitHubBlobMetadata = z.infer<typeof gitHubBlobMetadataSchema>;
