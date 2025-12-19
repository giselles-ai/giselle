"use server";

import { App, AppId, NodeId } from "@giselles-ai/protocol";
import { createId } from "@paralleldrive/cuid2";
import type { User } from "@supabase/auth-js";
import { giselle } from "@/app/giselle";
import {
	agents,
	apps,
	db,
	supabaseUserMappings,
	teamMemberships,
	teams,
	users,
	workspaces,
} from "@/db";
import { isEmailFromRoute06 } from "@/lib/utils";
import { createTeamId } from "@/services/teams/utils";

export const initializeAccount = async (
	supabaseUserId: User["id"],
	supabaseUserEmail: User["email"],
	supabaseUserAvatarUrl?: User["user_metadata"]["avatar_url"],
) => {
	const result = await db.transaction(async (tx) => {
		const userId = `usr_${createId()}` as const;
		const [user] = await tx
			.insert(users)
			.values({
				id: userId,
				email: supabaseUserEmail,
				avatarUrl: supabaseUserAvatarUrl ?? null,
			})
			.returning({
				dbId: users.dbId,
			});
		await tx.insert(supabaseUserMappings).values({
			userDbId: user.dbId,
			supabaseUserId,
		});
		const internalAccount = isEmailFromRoute06(supabaseUserEmail ?? "");
		const [team] = await tx
			.insert(teams)
			.values({
				id: createTeamId(),
				name: "My Project",
				plan: internalAccount ? "internal" : "free",
			})
			.returning({
				id: teams.dbId,
			});

		await tx.insert(teamMemberships).values({
			userDbId: user.dbId,
			teamDbId: team.id,
			role: "admin",
		});

		// create sample apps
		const sampleWorkspaceResults = await giselle.createSampleWorkspaces();

		// Fetch template apps to copy their entry node information
		const templateWorkspaceIds = sampleWorkspaceResults.map(
			(result) => result.templateWorkspaceId,
		);
		const templateWorkspacesWithApps = await db.query.workspaces.findMany({
			where: (workspaces, { inArray }) =>
				inArray(workspaces.id, templateWorkspaceIds),
			with: {
				app: {
					columns: {
						id: true,
						appEntryNodeId: true,
						endNodeId: true,
					},
				},
			},
		});

		// Create a map from templateWorkspaceId to its app info
		const templateAppMap = new Map(
			templateWorkspacesWithApps
				.filter((w) => w.app !== null)
				.map((w) => [w.id, w.app]),
		);

		for (const result of sampleWorkspaceResults) {
			const { workspace, templateWorkspaceId, idMap } = result;
			const agentId = `agnt_${createId()}` as const;
			await tx.insert(agents).values({
				id: agentId,
				name: workspace.name,
				teamDbId: team.id,
				creatorDbId: user.dbId,
				workspaceId: workspace.id,
				metadata: { sample: true },
			});
			const [insertedWorkspace] = await tx
				.insert(workspaces)
				.values({
					id: workspace.id,
					name: workspace.name,
					teamDbId: team.id,
					creatorDbId: user.dbId,
					metadata: { sample: true },
				})
				.returning({ dbId: workspaces.dbId });

			// Create app record and JSON file if template has an app
			const templateAppInfo = templateAppMap.get(templateWorkspaceId);
			if (templateAppInfo) {
				const newEntryNodeId = idMap.get(templateAppInfo.appEntryNodeId);
				const newEndNodeId = templateAppInfo.endNodeId
					? (idMap.get(templateAppInfo.endNodeId) ?? null)
					: null;

				if (newEntryNodeId) {
					const newAppId = AppId.generate();

					// Insert DB record
					await tx.insert(apps).values({
						id: newAppId,
						appEntryNodeId: NodeId.parse(newEntryNodeId),
						endNodeId: newEndNodeId ? NodeId.parse(newEndNodeId) : null,
						teamDbId: team.id,
						workspaceDbId: insertedWorkspace.dbId,
					});

					// Get template app JSON and create new app JSON with mapped IDs
					const templateAppJson = await giselle.getApp({
						appId: templateAppInfo.id,
					});

					// Create new app JSON with mapped node IDs and save directly to storage
					// (not using giselle.saveApp() because it triggers appCreate callback which inserts DB record)
					const storage = giselle.getContext().storage;
					const appPath = `apps/${newAppId}.json` as const;

					if (templateAppJson.state === "connected" && newEndNodeId) {
						await storage.setJson({
							path: appPath,
							schema: App,
							data: {
								id: newAppId,
								version: "v1",
								state: "connected",
								description: templateAppJson.description,
								parameters: templateAppJson.parameters,
								entryNodeId: NodeId.parse(newEntryNodeId),
								endNodeId: NodeId.parse(newEndNodeId),
								workspaceId: workspace.id,
							},
						});
					} else {
						await storage.setJson({
							path: appPath,
							schema: App,
							data: {
								id: newAppId,
								version: "v1",
								state: "disconnected",
								description: templateAppJson.description,
								parameters: templateAppJson.parameters,
								entryNodeId: NodeId.parse(newEntryNodeId),
								workspaceId: workspace.id,
							},
						});
					}
				}
			}
		}

		return { id: userId };
	});
	return result;
};
