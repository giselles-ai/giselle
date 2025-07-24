import { createPostgresQueryService } from "@giselle-sdk/rag";
import { getTableName } from "drizzle-orm";
import z from "zod/v4";
import { githubRepositoryPullRequestEmbeddings } from "@/drizzle";
import { createDatabaseConfig } from "../database";
import { resolveGitHubPullRequestEmbeddingFilter } from "./pr-resolver";

/**
 * Pre-configured GitHub Pull Request query service instance
 */
export const gitHubPullRequestQueryService = createPostgresQueryService({
	database: createDatabaseConfig(),
	tableName: getTableName(githubRepositoryPullRequestEmbeddings),
	metadataSchema: z.object({
		prNumber: z.number(),
		mergedAt: z.date(),
		contentType: z.string(),
		contentId: z.string(),
	}),
	contextToFilter: resolveGitHubPullRequestEmbeddingFilter,
});
