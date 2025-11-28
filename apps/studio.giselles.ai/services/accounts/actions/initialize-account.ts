"use server";

import { createId } from "@paralleldrive/cuid2";
import type { User } from "@supabase/auth-js";
import { giselle } from "@/app/giselle";
import {
	agents,
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
		const sampleWorkspaces = await giselle.createSampleWorkspaces();
		for (const workspace of sampleWorkspaces) {
			const agentId = `agnt_${createId()}` as const;
			await tx.insert(agents).values({
				id: agentId,
				name: workspace.name,
				teamDbId: team.id,
				creatorDbId: user.dbId,
				workspaceId: workspace.id,
				metadata: { sample: true },
			});
			await tx.insert(workspaces).values({
				id: workspace.id,
				name: workspace.name,
				teamDbId: team.id,
				creatorDbId: user.dbId,
				metadata: { sample: true },
			});
		}

		return { id: userId };
	});
	return result;
};
