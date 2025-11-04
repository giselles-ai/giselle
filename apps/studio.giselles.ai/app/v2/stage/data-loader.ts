import { db } from "@/db";
import { logger } from "@/lib/logger";
import { getUser } from "@/lib/supabase";

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
				type: teamMembership.team.type,
				role: teamMembership.role,
				hasActiveSubscription: teamMembership.team.subscriptions.some(
					(subscription) => subscription.status === "active",
				),
			})),
		);
}

export async function dataLoader() {
	const teams = await userTeams();

	logger.debug({ teams });
	return { teams };
}

export type LoaderData = Awaited<ReturnType<typeof dataLoader>>;
