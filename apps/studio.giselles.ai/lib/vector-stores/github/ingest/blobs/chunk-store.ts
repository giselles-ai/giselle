import type { EmbeddingProfileId } from "@giselle-ai/protocol";
import { createPostgresChunkStore } from "@giselle-ai/rag";
import { getTableName } from "drizzle-orm";
import z from "zod/v4";
import { githubRepositoryEmbeddings } from "@/db";
import { createDatabaseConfig } from "../../database";

/**
 * GitHub Blob chunk store factory - for ingestion pipeline
 */
export function createGitHubBlobChunkStore(
	repositoryIndexDbId: number,
	embeddingProfileId: EmbeddingProfileId,
) {
	return createPostgresChunkStore({
		database: createDatabaseConfig(),
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
