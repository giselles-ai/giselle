import { and, desc, eq } from "drizzle-orm";
import { acts, agents, db } from "@/drizzle";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchUserTeams } from "@/services/teams";
import { fetchFlowTriggers } from "../(top)/services";
import { ShowcaseClient } from "./showcase-client";

export default async function StageShowcasePage() {
	const teams = await fetchUserTeams();
	const teamOptions = teams.map((team) => ({
		value: team.id,
		label: team.name,
		avatarUrl: team.avatarUrl ?? undefined,
	}));

	// Fetch only executable apps (using same logic as stage)
	const user = await fetchCurrentUser();
	const executableFlowTriggers = await fetchFlowTriggers(teams, "all", user);

	// Group by team and transform to expected App interface
	const teamAppsMap = new Map();
	for (const team of teams) {
		const teamFlowTriggers = executableFlowTriggers.filter(
			(trigger) => trigger.teamId === team.id,
		);

		// Transform FlowTriggerUIItem to App interface with proper updatedAt
		const teamApps = await Promise.all(
			teamFlowTriggers.map(async (trigger) => {
				try {
					// Get actual updatedAt from agents table
					const agent = await db
						.select({
							updatedAt: agents.updatedAt,
						})
						.from(agents)
						.where(eq(agents.workspaceId, trigger.sdkData.workspaceId))
						.limit(1);

					return {
						id: trigger.id,
						name: trigger.workspaceName,
						updatedAt: agent[0]?.updatedAt || new Date(),
						workspaceId: trigger.sdkData.workspaceId,
					};
				} catch {
					return {
						id: trigger.id,
						name: trigger.workspaceName,
						updatedAt: new Date(),
						workspaceId: trigger.sdkData.workspaceId,
					};
				}
			}),
		);

		teamAppsMap.set(team.id, teamApps);
	}

	// Convert map to plain object for client component
	const teamApps = Object.fromEntries(teamAppsMap);

	// Fetch execution history (acts) for all teams
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
