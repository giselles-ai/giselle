import {
	agents,
	db,
	githubRepositoryEmbeddings,
	githubRepositoryIndex,
	teams,
} from "@/drizzle";
import {
	type GitHubChunkMetadata,
	githubChunkMetadataSchema,
} from "@/lib/github-schema";
import type { GitHubQueryContext } from "@giselle-sdk/giselle-engine";
import { type DatabaseConfig, createQueryService } from "@giselle/rag3";
import { and, eq, getTableName } from "drizzle-orm";

// Create PostgreSQL connection config from environment
function createDatabaseConfig(): DatabaseConfig {
	const postgresUrl = process.env.POSTGRES_URL;
	if (!postgresUrl) {
		throw new Error("POSTGRES_URL environment variable is required");
	}
	return { connectionString: postgresUrl };
}

export const gitHubQueryService = createQueryService<
	GitHubQueryContext,
	GitHubChunkMetadata
>({
	database: createDatabaseConfig(),
	tableName: getTableName(githubRepositoryEmbeddings),
	// embedder は省略して自動的にデフォルトのOpenAI embedderを使用
	metadataSchema: githubChunkMetadataSchema,
	contextToFilter: resolveGitHubEmbeddingFilter,
	requiredColumnOverrides: {
		documentKey: "path",
		content: "chunk_content",
		index: "chunk_index",
		// embedding: "embedding" (default)
	},
	// Metadata fields will auto-convert from camelCase to snake_case:
	// repositoryIndexDbId -> repository_index_db_id
	// commitSha -> commit_sha
	// fileSha -> file_sha
	// path -> path
	// nodeId -> node_id
});

// Context resolver - handles complex DB resolution logic
async function resolveGitHubEmbeddingFilter(
	context: GitHubQueryContext,
): Promise<Record<string, unknown>> {
	const { workspaceId, owner, repo } = context;

	// Input validation
	if (!workspaceId || workspaceId.trim().length === 0) {
		throw new Error("Workspace ID is required");
	}
	if (!owner || owner.trim().length === 0) {
		throw new Error("Repository owner is required");
	}
	if (!repo || repo.trim().length === 0) {
		throw new Error("Repository name is required");
	}

	// Look up team from workspace
	const teamRecords = await db
		.select({ dbId: teams.dbId })
		.from(teams)
		.innerJoin(agents, eq(agents.workspaceId, workspaceId))
		.where(eq(teams.dbId, agents.teamDbId))
		.limit(1);

	if (teamRecords.length === 0) {
		throw new Error("Team not found");
	}
	const teamDbId = teamRecords[0].dbId;

	// Look up repository index
	const repositoryIndex = await db
		.select({ dbId: githubRepositoryIndex.dbId })
		.from(githubRepositoryIndex)
		.where(
			and(
				eq(githubRepositoryIndex.teamDbId, teamDbId),
				eq(githubRepositoryIndex.owner, owner),
				eq(githubRepositoryIndex.repo, repo),
			),
		)
		.limit(1);

	if (repositoryIndex.length === 0) {
		throw new Error("Repository index not found");
	}

	// Return DB-level filters
	return {
		repository_index_db_id: repositoryIndex[0].dbId,
	};
}
