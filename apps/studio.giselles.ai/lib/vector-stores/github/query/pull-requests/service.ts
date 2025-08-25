import type { GitHubQueryContext } from "@giselle-sdk/giselle";
import { createPostgresQueryService } from "@giselle-sdk/rag";
import { getTableName } from "drizzle-orm";
import { githubRepositoryPullRequestEmbeddings } from "@/drizzle";
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
	contextToEmbeddingProfileId: (context: GitHubQueryContext) =>
		context.embeddingProfileId,
	additionalResolver: addPRContextToResults,
});
