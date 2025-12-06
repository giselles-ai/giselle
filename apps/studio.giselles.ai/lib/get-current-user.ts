import { db } from "@/db";
import { getUser } from "./supabase";

export async function getCurrentUser() {
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
		db: supabaseUserWithUser.user.dbId,
		displayName: supabaseUserWithUser.user.displayName,
		email: supabaseUserWithUser.user.email,
		avatarUrl: supabaseUserWithUser.user.avatarUrl,
	};
}
