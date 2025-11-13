import { GitHubRepositoryIssueContentTypeValues } from "@giselles-ai/github-tool";
import type { EmbeddingProfileId } from "@giselles-ai/protocol";
import { createPostgresChunkStore } from "@giselles-ai/rag";
import { getTableName } from "drizzle-orm";
import z from "zod/v4";
import { githubRepositoryIssueEmbeddings } from "@/db";
import { createDatabaseConfig } from "../../database";

/**
 * GitHub Issue chunk store factory - for ingestion pipeline
 */
export function createGitHubIssueChunkStore(
	repositoryIndexDbId: number,
	embeddingProfileId: EmbeddingProfileId,
) {
	return createPostgresChunkStore({
		database: createDatabaseConfig(),
		tableName: getTableName(githubRepositoryIssueEmbeddings),
		metadataSchema: z.object({
			repositoryIndexDbId: z.number(),
			issueNumber: z.number(),
			issueState: z.string(),
			issueStateReason: z.string().nullable(),
			issueUpdatedAt: z.date(),
			issueClosedAt: z.date().nullable(),
			contentType: z.enum(GitHubRepositoryIssueContentTypeValues),
			contentId: z.string(),
			contentCreatedAt: z.date(),
			contentEditedAt: z.date(),
			metadataVersion: z.string(),
		}),
		scope: {
			repository_index_db_id: repositoryIndexDbId,
		},
		embeddingProfileId,
		requiredColumnOverrides: {
			version: githubRepositoryIssueEmbeddings.contentEditedAt.name,
		},
	});
}
