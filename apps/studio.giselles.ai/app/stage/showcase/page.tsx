import { and, desc, eq, isNotNull } from "drizzle-orm";
import { acts, agents, db } from "@/drizzle";
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

	// Fetch apps (agents) for all teams
	const teamAppsMap = new Map();
	for (const team of teams) {
		const dbAgents = await db
			.select({
				id: agents.id,
				name: agents.name,
				updatedAt: agents.updatedAt,
				workspaceId: agents.workspaceId,
			})
			.from(agents)
			.where(and(eq(agents.teamDbId, team.dbId), isNotNull(agents.workspaceId)))
			.orderBy(desc(agents.updatedAt));

		teamAppsMap.set(team.id, dbAgents);
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
