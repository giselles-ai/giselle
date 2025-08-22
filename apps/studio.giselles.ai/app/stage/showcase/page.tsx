import { and, desc, eq, isNotNull, inArray } from "drizzle-orm";
import { acts, agents, db, flowTriggers } from "@/drizzle";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchUserTeams } from "@/services/teams";
import { ShowcaseClient } from "./showcase-client";

export default async function StageShowcasePage() {
	const teams = await fetchUserTeams();
	const teamOptions = teams.map((team) => ({
		value: team.id,
		label: team.name,
		avatarUrl: team.avatarUrl ?? undefined,
	}));

	// Fetch apps (agents) for all teams that have staged flow triggers in a single optimized query
	const teamDbIds = teams.map(t => t.dbId);
	
	const allStagedAgents = await db
		.selectDistinct({
			id: agents.id,
			name: agents.name,
			updatedAt: agents.updatedAt,
			workspaceId: agents.workspaceId,
			teamDbId: agents.teamDbId,
		})
		.from(agents)
		.innerJoin(
			flowTriggers,
			and(
				eq(agents.workspaceId, flowTriggers.sdkWorkspaceId),
				eq(agents.teamDbId, flowTriggers.teamDbId),
				eq(flowTriggers.staged, true),
			),
		)
		.where(
			and(
				inArray(agents.teamDbId, teamDbIds),
				isNotNull(agents.workspaceId),
			),
		)
		.orderBy(desc(agents.updatedAt));

	// Group agents by team
	const teamAppsMap = new Map();
	for (const team of teams) {
		const teamAgents = allStagedAgents.filter(agent => agent.teamDbId === team.dbId);
		teamAppsMap.set(team.id, teamAgents);
	}

	// Convert map to plain object for client component
	const teamApps = Object.fromEntries(teamAppsMap);

	// Fetch execution history (acts) for all teams
	const user = await fetchCurrentUser();
	const teamHistoryMap = new Map();
	for (const team of teams) {
		const dbActs = await db
			.select({
				dbId: acts.dbId,
				sdkActId: acts.sdkActId,
				sdkWorkspaceId: acts.sdkWorkspaceId,
				createdAt: acts.createdAt,
				teamDbId: acts.teamDbId,
			})
			.from(acts)
			.where(
				and(eq(acts.directorDbId, user.dbId), eq(acts.teamDbId, team.dbId)),
			)
			.orderBy(desc(acts.createdAt));

		// Get workspace names for acts
		const enrichedActs = await Promise.all(
			dbActs.map(async (act) => {
				try {
					const agent = await db
						.select({
							name: agents.name,
							workspaceId: agents.workspaceId,
						})
						.from(agents)
						.where(eq(agents.workspaceId, act.sdkWorkspaceId))
						.limit(1);

					return {
						id: act.dbId.toString(),
						name: agent[0]?.name || "Untitled",
						updatedAt: act.createdAt,
						workspaceId: act.sdkWorkspaceId,
					};
				} catch {
					return {
						id: act.dbId.toString(),
						name: "Untitled",
						updatedAt: act.createdAt,
						workspaceId: act.sdkWorkspaceId,
					};
				}
			}),
		);

		teamHistoryMap.set(team.id, enrichedActs);
	}

	// Convert map to plain object for client component
	const teamHistory = Object.fromEntries(teamHistoryMap);

	return (
		<ShowcaseClient
			teamOptions={teamOptions}
			teamApps={teamApps}
			teamHistory={teamHistory}
		/>
	);
}
