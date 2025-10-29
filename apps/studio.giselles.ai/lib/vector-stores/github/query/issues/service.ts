import { createPostgresQueryService } from "@giselle-sdk/rag";
import { getTableName } from "drizzle-orm";
import { githubRepositoryIssueEmbeddings } from "@/drizzle";
import { createDatabaseConfig } from "../../database";
import { addIssueContextToResults } from "./issue-context-utils";
import { resolveGitHubIssueEmbeddingFilter } from "./resolver";
import { gitHubIssueMetadataSchema } from "./schema";

/**
 * GitHub Issues query service with additional context
 */
export const gitHubIssueQueryService = createPostgresQueryService({
	database: createDatabaseConfig(),
	tableName: getTableName(githubRepositoryIssueEmbeddings),
	metadataSchema: gitHubIssueMetadataSchema,
	contextToFilter: resolveGitHubIssueEmbeddingFilter,
	contextToEmbeddingProfileId: (context) => context.embeddingProfileId,
	additionalResolver: addIssueContextToResults,
});
