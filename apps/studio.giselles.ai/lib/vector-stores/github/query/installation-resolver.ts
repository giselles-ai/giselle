import type { WorkspaceId } from "@giselle-sdk/data-type";
import { and, eq } from "drizzle-orm";
import { agents, db, githubRepositoryIndex, teams } from "@/drizzle";

/**
 * Resolve GitHub App installationId for a repository within a workspace context.
 */
export async function installationIdForRepository(args: {
	workspaceId: WorkspaceId;
	owner: string;
	repo: string;
}): Promise<number | undefined> {
	const { workspaceId, owner, repo } = args;

	const teamRecords = await db
		.select({ dbId: teams.dbId })
		.from(teams)
		.innerJoin(agents, eq(agents.teamDbId, teams.dbId))
		.where(eq(agents.workspaceId, workspaceId))
		.limit(1);
	if (teamRecords.length === 0) return undefined;
	const teamDbId = teamRecords[0].dbId;

	const repoRows = await db
		.select({ installationId: githubRepositoryIndex.installationId })
		.from(githubRepositoryIndex)
		.where(
			and(
				eq(githubRepositoryIndex.teamDbId, teamDbId),
				eq(githubRepositoryIndex.owner, owner),
				eq(githubRepositoryIndex.repo, repo),
			),
		)
		.limit(1);
	return repoRows[0]?.installationId ?? undefined;
}
