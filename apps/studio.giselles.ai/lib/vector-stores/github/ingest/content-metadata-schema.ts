import { z } from "zod/v4";
import type { GitHubRepositoryContentType } from "@/drizzle/schema";

/**
 * Schema for blob content metadata
 */
const blobContentMetadataSchema = z.object({
	lastIngestedCommitSha: z.string().optional(),
});

/**
 * Schema for content status metadata (currently only blob, extensible for pull_requests)
 */
const contentStatusMetadataSchema = z
	.discriminatedUnion("contentType", [
		z.object({
			contentType: z.literal("blob"),
			...blobContentMetadataSchema.shape,
		}),
	])
	.nullable();

export type ContentStatusMetadata = z.infer<typeof contentStatusMetadataSchema>;
type BlobContentMetadata = z.infer<typeof blobContentMetadataSchema>;

export function safeParseContentStatusMetadata(
	metadata: unknown,
	contentType: GitHubRepositoryContentType,
):
	| { success: true; data: ContentStatusMetadata }
	| { success: false; error: string } {
	if (metadata === null) {
		return { success: true, data: null };
	}

	const metadataWithType = { ...metadata, contentType };
	const result = contentStatusMetadataSchema.safeParse(metadataWithType);

	if (result.success) {
		return { success: true, data: result.data };
	} else {
		return { success: false, error: result.error.message };
	}
}

export function createBlobContentMetadata(
	data: BlobContentMetadata,
): BlobContentMetadata {
	return blobContentMetadataSchema.parse(data);
}
