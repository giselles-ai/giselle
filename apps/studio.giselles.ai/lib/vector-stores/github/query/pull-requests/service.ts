import { createPostgresQueryService } from "@giselles-ai/rag";
import { getTableName } from "drizzle-orm";
import { githubRepositoryPullRequestEmbeddings } from "@/db";
import { createDatabaseConfig } from "../../database";
import { addPRContextToResults } from "./pr-context-utils";
import { resolveGitHubPullRequestEmbeddingFilter } from "./resolver";
import { gitHubPullRequestMetadataSchema } from "./schema";

/**
 * GitHub Pull Request query service with additional context
 */
export const gitHubPullRequestQueryService = createPostgresQueryService({
	database: createDatabaseConfig(),
	tableName: getTableName(githubRepositoryPullRequestEmbeddings),
	metadataSchema: gitHubPullRequestMetadataSchema,
	contextToFilter: resolveGitHubPullRequestEmbeddingFilter,
	contextToEmbeddingProfileId: (context) => context.embeddingProfileId,
	additionalResolver: addPRContextToResults,
});
