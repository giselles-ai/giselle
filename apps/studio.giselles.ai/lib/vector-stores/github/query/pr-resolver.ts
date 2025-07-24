import type { GitHubPullRequestQueryContext } from "@giselle-sdk/giselle";
import { and, eq } from "drizzle-orm";
import {
	agents,
	db,
	githubRepositoryIndex,
	githubRepositoryPullRequestEmbeddings,
	teams,
} from "@/drizzle";

/**
 * Context resolver - handles complex DB resolution logic for GitHub Pull Request queries
 */
export async function resolveGitHubPullRequestEmbeddingFilter(
	context: GitHubPullRequestQueryContext,
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
		[githubRepositoryPullRequestEmbeddings.repositoryIndexDbId.name]:
			repositoryIndex[0].dbId,
	};
}
