import type { EmbeddingProfileId } from "@giselle-sdk/data-type";
import { createPostgresChunkStore } from "@giselle-sdk/rag";
import { getTableName } from "drizzle-orm";
import z from "zod/v4";
import {
	GitHubRepositoryPullRequestContentTypeValues,
	githubRepositoryPullRequestEmbeddings,
} from "@/db";
import { createDatabaseConfig } from "../../database";

/**
 * GitHub Pull Request chunk store factory - for ingestion pipeline
 */
export function createGitHubPullRequestChunkStore(
	repositoryIndexDbId: number,
	embeddingProfileId: EmbeddingProfileId,
) {
	return createPostgresChunkStore({
		database: createDatabaseConfig(),
		tableName: getTableName(githubRepositoryPullRequestEmbeddings),
		metadataSchema: z.object({
			repositoryIndexDbId: z.number(),
			prNumber: z.number(),
			mergedAt: z.date(),
			contentType: z.enum(GitHubRepositoryPullRequestContentTypeValues),
			contentId: z.string(),
		}),
		scope: {
			repository_index_db_id: repositoryIndexDbId,
		},
		embeddingProfileId,
		requiredColumnOverrides: {
			version: githubRepositoryPullRequestEmbeddings.mergedAt.name,
		},
	});
}
