import { giselleEngine } from "@/app/giselle-engine";
import { db } from "@/db";
import { logger } from "@/lib/logger";
import { getUser } from "@/lib/supabase";
import type { TeamId } from "./types";

async function userTeams() {
	const supabaseUser = await getUser();
	const user = await db.query.supabaseUserMappings.findFirst({
		where: (supabaseUserMappings, { eq }) =>
			eq(supabaseUserMappings.supabaseUserId, supabaseUser.id),
	});
	if (user === undefined) {
		throw new Error("User not found");
	}
	return await db.query.teamMemberships
		.findMany({
			where: (teamMemberships, { eq }) =>
				eq(teamMemberships.userDbId, user.userDbId),
			with: {
				team: {
					with: {
						subscriptions: {
							where: (subscriptions, { eq }) =>
								eq(subscriptions.status, "active"),
						},
					},
				},
			},
		})
		.then((teamMemberships) =>
			teamMemberships.map((teamMembership) => ({
				id: teamMembership.team.id,
				name: teamMembership.team.name,
				avatarUrl: teamMembership.team.avatarUrl,
				role: teamMembership.role,
				hasActiveSubscription: teamMembership.team.subscriptions.some(
					(subscription) => subscription.status === "active",
				),
			})),
		);
}

async function userApps(teamIds: TeamId[]) {
	return await db.query.teams
		.findMany({
			where: (teams, { inArray }) => inArray(teams.id, teamIds),
			with: {
				apps: {
					columns: {
						id: true,
						appEntryNodeId: true,
					},
					with: {
						workspace: {
							columns: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		})
		.then(
			async (teams) =>
				await Promise.all(
					teams.flatMap((team) =>
						team.apps
							.map(async (app) => {
								const workspace = await giselleEngine.getWorkspace(
									app.workspace.id,
								);
								const appEntryNode = workspace.nodes.find(
									(node) => node.id === app.appEntryNodeId,
								);
								if (appEntryNode === undefined) {
									logger.warn(
										`App entry node<${app.appEntryNodeId}> not found for app<${app.id}>.`,
									);
									return null;
								}
								return {
									name:
										appEntryNode.name ?? "New App" /** @todo default name */,
									appEntryNodeId: appEntryNode.id,
									workspaceId: workspace.id,
									workspaceName: workspace.name,
									teamName: team.name,
									teamId: team.id,
								};
							})
							.filter((appOrNull) => appOrNull !== null),
					),
				).then((apps) => apps.filter((teamOrApps) => teamOrApps !== null)),
		);
}

export async function dataLoader() {
	const teams = await userTeams();
	const apps = await userApps(teams.map((team) => team.id));

	logger.debug({ teams, apps });
	return { teams, apps };
}

export type LoaderData = Awaited<ReturnType<typeof dataLoader>>;
