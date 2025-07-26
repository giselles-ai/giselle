import { createPostgresQueryService } from "@giselle-sdk/rag";
import { getTableName } from "drizzle-orm";
import z from "zod/v4";
import { githubRepositoryEmbeddings } from "@/drizzle";
import { createDatabaseConfig } from "../database";
import { resolveGitHubEmbeddingFilter } from "./resolver";

/**
 * Pre-configured GitHub query service instance
 */
export const gitHubQueryService = createPostgresQueryService({
	database: createDatabaseConfig(),
	tableName: getTableName(githubRepositoryEmbeddings),
	metadataSchema: z.object({
		fileSha: z.string(),
		path: z.string(),
	}),
	contextToFilter: resolveGitHubEmbeddingFilter,
});
