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
export function getGitHubPullRequestQueryService() {
	const dbConfig = createDatabaseConfig();
	if (!dbConfig) {
		throw new Error(
			"Missing POSTGRES_URL for GitHub Pull Request query service",
		);
	}
	return createPostgresQueryService({
		database: dbConfig,
		tableName: getTableName(githubRepositoryPullRequestEmbeddings),
		metadataSchema: gitHubPullRequestMetadataSchema,
		contextToFilter: resolveGitHubPullRequestEmbeddingFilter,
		contextToEmbeddingProfileId: (context) => context.embeddingProfileId,
		additionalResolver: addPRContextToResults,
	});
}
