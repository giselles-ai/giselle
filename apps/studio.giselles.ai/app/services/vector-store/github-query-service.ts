import {
	agents,
	db,
	githubRepositoryEmbeddings,
	githubRepositoryIndex,
	teams,
} from "@/drizzle";
import { GitHubBlob, type GitHubBlobMetadata } from "@/lib/github-schema";
import type { GitHubQueryContext } from "@giselle-sdk/giselle-engine";
import type { DbValue } from "@giselle-sdk/rag2";
import { createPostgresQueryService } from "@giselle-sdk/rag2";
import { and, eq, getTableName } from "drizzle-orm";

export const gitHubQueryService = createPostgresQueryService<
	GitHubQueryContext,
	GitHubBlobMetadata
>(createPostgresConfig(), {
	tableName: getTableName(githubRepositoryEmbeddings),
	metadataDefinition: GitHubBlob.createMetadataDefinition(),
	filterResolver: resolveGitHubEmbeddingFilter,
});

// Context resolver - handles complex DB resolution logic
async function resolveGitHubEmbeddingFilter(
	context: GitHubQueryContext,
): Promise<Record<string, DbValue>> {
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

	// Return DB-level filters using correct column mapping
	const repositoryIndexDbIdColumn =
		GitHubBlob.columnMapping.repositoryIndexDbId;
	return {
		[repositoryIndexDbIdColumn]: repositoryIndex[0].dbId,
	};
}

// Create PostgreSQL connection config from environment
function createPostgresConfig() {
	const postgresUrl = process.env.POSTGRES_URL;
	if (!postgresUrl) {
		throw new Error("POSTGRES_URL environment variable is required");
	}
	return { connectionString: postgresUrl };
}
