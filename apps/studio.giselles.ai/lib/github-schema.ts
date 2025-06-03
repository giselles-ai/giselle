import {
	type ChunkOf,
	GitHubBlobSourceType,
	type MetadataOf,
	defineStorageSchema,
} from "@giselle-sdk/rag2";
import { z } from "zod/v4";

/**
 * GitHub Blob document type configuration
 */
const gitHubBlobMetadataSchema = z.object({
	repositoryIndexDbId: z.number(),
	commitSha: z.string(),
	fileSha: z.string(),
	path: z.string(),
	nodeId: z.string(),
});
export const GitHubBlob = defineStorageSchema(
	GitHubBlobSourceType,
	gitHubBlobMetadataSchema,
	{
		documentKey: "path",
		sourceKeys: ["repositoryIndexDbId"],
	},
);

// Export types for convenience
export type GitHubBlobMetadata = MetadataOf<typeof GitHubBlob>;
export type GitHubBlobChunk = ChunkOf<typeof GitHubBlob>;
