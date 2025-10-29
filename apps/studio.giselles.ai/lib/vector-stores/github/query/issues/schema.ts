import { z } from "zod/v4";

/**
 * Metadata schema for GitHub Issues embeddings
 */
export const gitHubIssueMetadataSchema = z.object({
	issueNumber: z.number(),
	issueState: z.string(),
	issueStateReason: z.string().nullable(),
	issueUpdatedAt: z.date(),
	issueClosedAt: z.date().nullable(),
	contentType: z.string(),
	contentId: z.string(),
});

export type GitHubIssueMetadata = z.infer<typeof gitHubIssueMetadataSchema>;
