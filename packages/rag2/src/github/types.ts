import { z } from "zod/v4";
import { BaseDocumentSource } from "../types";

export const GitHubBlobSourceType = "github-blob";

// GitHub-specific source types for API access
export const GitHubBlobSource = BaseDocumentSource.extend({
	type: z.literal(GitHubBlobSourceType),
	owner: z.string().min(1),
	repo: z.string().min(1),
	commitSha: z.string().min(1), // Specific commit required
});
export type GitHubBlobSource = z.infer<typeof GitHubBlobSource>;

// Basic GitHub metadata interface (not DB-specific)
// For concrete DB schemas, apps should define their own using createMetadataSchema
export interface GitHubBlobBasicMetadata {
	type: typeof GitHubBlobSourceType;
	owner: string;
	repo: string;
	commitSha: string;
	fileSha: string;
	path: string;
	nodeId: string;
}
