import type { EmbeddingProfileId } from "@giselle-sdk/data-type";
import { createPostgresChunkStore } from "@giselle-sdk/rag";
import { getTableName } from "drizzle-orm";
import z from "zod/v4";
import { githubRepositoryEmbeddings } from "@/drizzle";
import { createDatabaseConfig } from "../../database";

/**
 * GitHub Blob chunk store factory - for ingestion pipeline
 */
export function createGitHubBlobChunkStore(
	repositoryIndexDbId: number,
	embeddingProfileId: EmbeddingProfileId,
) {
	const dbConfig = createDatabaseConfig();
	if (!dbConfig) {
		throw new Error(
			"Missing POSTGRES_URL for GitHub Blob chunk store (ingestion pipeline)",
		);
	}
	return createPostgresChunkStore({
		database: dbConfig,
		tableName: getTableName(githubRepositoryEmbeddings),
		metadataSchema: z.object({
			repositoryIndexDbId: z.number(),
			fileSha: z.string(),
			path: z.string(),
		}),
		scope: {
			repository_index_db_id: repositoryIndexDbId,
		},
		embeddingProfileId,
		requiredColumnOverrides: {
			documentKey: githubRepositoryEmbeddings.path.name,
			version: githubRepositoryEmbeddings.fileSha.name,
		},
	});
}
