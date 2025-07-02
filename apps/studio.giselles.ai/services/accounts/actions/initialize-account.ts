"use server";

import { createId } from "@paralleldrive/cuid2";
import type { User } from "@supabase/auth-js";
import { giselleEngine } from "@/app/giselle-engine";
import {
	agents,
	db,
	supabaseUserMappings,
	teamMemberships,
	teams,
	users,
} from "@/drizzle";
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
		const [team] = await tx
			.insert(teams)
			.values({
				id: createTeamId(),
				name: "My Project",
				type: isEmailFromRoute06(supabaseUserEmail ?? "")
					? "internal"
					: "customer",
			})
			.returning({
				id: teams.dbId,
			});

		await tx.insert(teamMemberships).values({
			userDbId: user.dbId,
			teamDbId: team.id,
			role: "admin",
		});

		// create sample app
		const agentId = `agnt_${createId()}` as const;
		const workspace = await giselleEngine.createSampleWorkspace();
		await db.insert(agents).values({
			id: agentId,
			name: workspace.name,
			teamDbId: team.id,
			creatorDbId: user.dbId,
			workspaceId: workspace.id,
		});

		return { id: userId };
	});
	return result;
};
