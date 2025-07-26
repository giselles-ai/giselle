import { createPostgresChunkStore } from "@giselle-sdk/rag";
import { getTableName } from "drizzle-orm";
import z from "zod/v4";
import { githubRepositoryEmbeddings } from "@/drizzle";
import { createDatabaseConfig } from "../../database";

/**
 * GitHub Blob chunk store factory - for ingestion pipeline
 */
export function createGitHubBlobChunkStore(repositoryIndexDbId: number) {
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
		requiredColumnOverrides: {
			documentKey: githubRepositoryEmbeddings.path.name,
			version: githubRepositoryEmbeddings.fileSha.name,
		},
	});
}
