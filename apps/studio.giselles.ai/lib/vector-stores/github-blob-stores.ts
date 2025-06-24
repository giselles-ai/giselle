import {
	agents,
	db,
	githubRepositoryEmbeddings,
	githubRepositoryIndex,
	teams,
} from "@/drizzle";
import type { GitHubQueryContext } from "@giselle-sdk/giselle-engine";
import {
	type DatabaseConfig,
	createColumnMapping,
	createPostgresChunkStore,
	createPostgresQueryService,
} from "@giselle-sdk/rag";
import { and, eq, getTableName } from "drizzle-orm";
import { z } from "zod/v4";

/**
 * GitHub chunk metadata schema and type for RAG storage
 */
export const githubChunkMetadataSchema = z.object({
	repositoryIndexDbId: z.number(),
	commitSha: z.string(),
	fileSha: z.string(),
	path: z.string(),
	nodeId: z.string(),
});

export type GitHubChunkMetadata = z.infer<typeof githubChunkMetadataSchema>;

function createDatabaseConfig(): DatabaseConfig {
	const postgresUrl = process.env.POSTGRES_URL;
	if (!postgresUrl) {
		throw new Error("POSTGRES_URL environment variable is required");
	}
	return { connectionString: postgresUrl };
}

/**
 * GitHub Blob chunk store factory - for ingestion pipeline
 */
export function createGitHubBlobChunkStore(repositoryIndexDbId: number) {
	const columnMapping = createColumnMapping({
		metadataSchema: githubChunkMetadataSchema,
		requiredColumnOverrides: {
			documentKey: "path",
			version: "file_sha",
		},
	});

	return createPostgresChunkStore({
		database: createDatabaseConfig(),
		tableName: getTableName(githubRepositoryEmbeddings),
		columnMapping,
		metadataSchema: githubChunkMetadataSchema,
		scope: {
			repository_index_db_id: repositoryIndexDbId,
		},
	});
}

/**
 * Context resolver - handles complex DB resolution logic for GitHub queries
 */
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
		.innerJoin(agents, eq(agents.teamDbId, teams.dbId))
		.where(eq(agents.workspaceId, workspaceId))
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
		[githubRepositoryEmbeddings.repositoryIndexDbId.name]:
			repositoryIndex[0].dbId,
	};
}

const githubQueryMetadataSchema = z.object({
	commitSha: z.string(),
	fileSha: z.string(),
	path: z.string(),
	nodeId: z.string(),
});

/**
 * Pre-configured GitHub query service instance
 */
export const gitHubQueryService = createPostgresQueryService({
	database: createDatabaseConfig(),
	tableName: getTableName(githubRepositoryEmbeddings),
	metadataSchema: githubQueryMetadataSchema,
	contextToFilter: resolveGitHubEmbeddingFilter,
	requiredColumnOverrides: {
		documentKey: "path",
	},
});
