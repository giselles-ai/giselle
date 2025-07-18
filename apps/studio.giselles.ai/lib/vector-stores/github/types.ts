import { z } from "zod/v4";
import type {
	GitHubRepositoryContentType,
	githubRepositoryContentStatus,
	githubRepositoryIndex,
} from "@/drizzle/schema";

/**
 * Repository with all its content statuses
 */
export type RepositoryWithStatuses = {
	repositoryIndex: typeof githubRepositoryIndex.$inferSelect;
	contentStatuses: (typeof githubRepositoryContentStatus.$inferSelect)[];
};

/**
 * Schema for blob content metadata
 */
const blobMetadataSchema = z.object({
	lastIngestedCommitSha: z.string().optional(),
});

/**
 * Metadata schema map for each content type
 *
 * TODO: add Pull Request metadata schema when implemented
 */
const metadataSchemaMap = {
	blob: blobMetadataSchema,
} as const;

export type ContentMetadataMap = {
	blob: z.infer<typeof blobMetadataSchema>;
};

export type ContentStatusMetadata =
	| ContentMetadataMap[keyof ContentMetadataMap]
	| null;

type ContentMetadataFor<T extends GitHubRepositoryContentType> =
	T extends keyof ContentMetadataMap ? ContentMetadataMap[T] : never;

type BlobContentMetadata = z.infer<typeof blobMetadataSchema>;

export function safeParseContentStatusMetadata<
	T extends GitHubRepositoryContentType,
>(
	metadata: unknown,
	contentType: T,
):
	| { success: true; data: ContentMetadataFor<T> | null }
	| { success: false; error: string } {
	if (metadata === null || metadata === undefined) {
		return { success: true, data: null };
	}

	// Get the appropriate schema for the content type
	const schema =
		metadataSchemaMap[contentType as keyof typeof metadataSchemaMap];

	if (!schema) {
		return {
			success: false,
			error: `No metadata schema defined for content type: ${contentType}`,
		};
	}

	const result = schema.safeParse(metadata);

	if (result.success) {
		return { success: true, data: result.data as ContentMetadataFor<T> };
	} else {
		return { success: false, error: result.error.message };
	}
}

export function createBlobContentMetadata(
	data: BlobContentMetadata,
): ContentMetadataFor<"blob"> {
	return blobMetadataSchema.parse(data);
}

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
