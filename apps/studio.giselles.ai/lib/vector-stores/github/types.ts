import { z } from "zod/v4";
import type {
	GitHubRepositoryContentType,
	githubRepositoryContentStatus,
	githubRepositoryIndex,
} from "@/drizzle/schema";

export type RepositoryWithStatuses = {
	repositoryIndex: typeof githubRepositoryIndex.$inferSelect;
	contentStatuses: (typeof githubRepositoryContentStatus.$inferSelect)[];
};

const blobMetadataSchema = z.object({
	lastIngestedCommitSha: z.string().optional(),
});

const pullRequestMetadataSchema = z.object({
	lastIngestedPrNumber: z.number().optional(),
});

type BlobMetadata = z.infer<typeof blobMetadataSchema>;
type PullRequestMetadata = z.infer<typeof pullRequestMetadataSchema>;
export type ContentStatusMetadata = BlobMetadata | PullRequestMetadata | null;

const METADATA_SCHEMAS = {
	blob: blobMetadataSchema,
	pull_request: pullRequestMetadataSchema,
} as const;

type MetadataForContentType<T extends GitHubRepositoryContentType> =
	T extends "blob"
		? BlobMetadata
		: T extends "pull_request"
			? PullRequestMetadata
			: never;

export function getContentStatusMetadata<T extends GitHubRepositoryContentType>(
	metadata: unknown,
	contentType: T,
): MetadataForContentType<T> | null {
	if (!metadata) {
		return null;
	}

	const schema = METADATA_SCHEMAS[contentType];
	const parsed = schema.safeParse(metadata);

	return parsed.success ? (parsed.data as MetadataForContentType<T>) : null;
}

export function createBlobMetadata(data: BlobMetadata): BlobMetadata {
	return blobMetadataSchema.parse(data);
}

export function createPullRequestMetadata(
	data: PullRequestMetadata,
): PullRequestMetadata {
	return pullRequestMetadataSchema.parse(data);
}
