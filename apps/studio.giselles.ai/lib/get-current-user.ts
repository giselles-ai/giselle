import { cache } from "react";
import { db } from "@/db";
import { getUser } from "./supabase";

async function _getCurrentUser() {
	const supabaseUser = await getUser();
	const supabaseUserWithUser = await db.query.supabaseUserMappings.findFirst({
		where: (supabaseUserMappings, { eq }) =>
			eq(supabaseUserMappings.supabaseUserId, supabaseUser.id),
		with: {
			user: {
				columns: {
					dbId: true,
					id: true,
					displayName: true,
					email: true,
					avatarUrl: true,
				},
			},
		},
	});
	if (supabaseUserWithUser === undefined) {
		throw new Error("User not found");
	}
	return {
		id: supabaseUserWithUser.user.id,
		dbId: supabaseUserWithUser.user.dbId,
		displayName: supabaseUserWithUser.user.displayName,
		email: supabaseUserWithUser.user.email,
		avatarUrl: supabaseUserWithUser.user.avatarUrl,
	};
}

export const getCurrentUser = cache(_getCurrentUser);
