import { isIconName } from "@giselle-internal/ui/utils";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import { logger } from "@/lib/logger";
import { getUser } from "@/lib/supabase";
import type { StageApp, TeamId } from "./types";

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
				team: true,
			},
		})
		.then((teamMemberships) =>
			teamMemberships.map((teamMembership) => ({
				id: teamMembership.team.id,
				name: teamMembership.team.name,
				avatarUrl: teamMembership.team.avatarUrl,
				role: teamMembership.role,
				hasActiveSubscription: teamMembership.team.activeSubscriptionId != null,
			})),
		);
}

async function userApps(teamIds: TeamId[]) {
	const teams = await db.query.teams.findMany({
		where: (teams, { inArray }) => inArray(teams.id, teamIds),
		with: {
			apps: {
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
	});
	const result = await Promise.all(
		teams.flatMap((team) =>
			team.apps.map(async (app) => {
				const workspace = await giselle.getWorkspace(app.workspace.id);
				const appEntryNode = workspace.nodes.find(
					(node) => node.id === app.appEntryNodeId,
				);
				if (appEntryNode === undefined) {
					logger.warn(
						`App entry node<${app.appEntryNodeId}> not found for app<${app.id}>.`,
					);
					return null;
				}
				const giselleApp = await giselle.getApp({
					appId: app.id,
				});
				return { team, workspace, giselleApp };
			}),
		),
	).then((result) => result.filter((data) => data !== null));

	const apps: StageApp[] = [];

	for (const data of result) {
		apps.push({
			id: data.giselleApp.id,
			name: data.giselleApp.name,
			description: data.giselleApp.description,
			iconName: isIconName(data.giselleApp.iconName)
				? data.giselleApp.iconName
				: "cable",
			entryNodeId: data.giselleApp.entryNodeId,
			parameters: data.giselleApp.parameters,
			workspaceId: data.workspace.id,
			workspaceName: data.workspace.name ?? "Untitled workspace",
			teamName: data.team.name,
			teamId: data.team.id,
		});
	}

	return apps;
}

async function userTasks(teamIds: TeamId[]) {
	const teams = await db.query.teams.findMany({
		where: (teams, { inArray }) => inArray(teams.id, teamIds),
		with: {
			tasks: {
				columns: {
					id: true,
				},
				where: (tasks, { isNotNull }) => isNotNull(tasks.appDbId),
				orderBy: (tasks, { desc }) => desc(tasks.createdAt),
			},
		},
	});
	const taskIds = teams.flatMap((team) => team.tasks.map((task) => task.id));

	const tasks = await Promise.all(
		taskIds.map((taskId) => giselle.getTask({ taskId })),
	);
	return tasks;
}

export async function dataLoader() {
	const teams = await userTeams();
	const teamIds = teams.map((team) => team.id);
	const [apps, tasks] = await Promise.all([
		userApps(teamIds),
		userTasks(teamIds),
	]);

	logger.debug({ teams, apps, tasks });
	return { teams, apps, tasks };
}

export type LoaderData = Awaited<ReturnType<typeof dataLoader>>;
