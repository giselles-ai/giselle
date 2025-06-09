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

// Column mapping for GitHub blob storage
export const gitHubBlobColumnMapping: {
	// Required columns
	documentKey: string;
	content: string;
	index: string;
	embedding: string;
	// Metadata columns
	repositoryIndexDbId: string;
	commitSha: string;
	fileSha: string;
	path: string;
	nodeId: string;
} = {
	// Required columns
	documentKey: "path",
	content: "chunk_content",
	index: "chunk_index",
	embedding: "embedding",
	// Metadata columns
	repositoryIndexDbId: "repository_index_db_id",
	commitSha: "commit_sha",
	fileSha: "file_sha",
	path: "path",
	nodeId: "node_id",
};

// For backward compatibility
export const GitHubBlob = {
	documentKey: "path",
	sourceKeys: ["repositoryIndexDbId"] as const,
	columnMapping: gitHubBlobColumnMapping,
	metadataSchema: gitHubBlobMetadataSchema,
};

// For backward compatibility - not used in rag3
export type GitHubBlobChunk = {
	content: string;
	index: number;
	embedding?: number[];
};
