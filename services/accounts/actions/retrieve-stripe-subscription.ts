import {
	db,
	organizations,
	subscriptions,
	supabaseUserMappings,
	teamMemberships,
	teams,
	users,
} from "@/drizzle";
import { and, eq } from "drizzle-orm";

export const retrieveActiveStripeSubscriptionBySupabaseUserId = async (
	supabaseUserId: string,
) => {
	const [subscription] = await db
		.selectDistinct({ id: subscriptions.id })
		.from(subscriptions)
		.innerJoin(
			organizations,
			eq(organizations.dbId, subscriptions.organizationDbId),
		)
		.innerJoin(teams, eq(teams.organizationDbId, organizations.dbId))
		.innerJoin(teamMemberships, eq(teamMemberships.teamDbId, teams.dbId))
		.innerJoin(users, eq(users.dbId, teamMemberships.userDbId))
		.innerJoin(
			supabaseUserMappings,
			eq(supabaseUserMappings.userDbId, users.dbId),
		)
		.where(
			and(
				eq(supabaseUserMappings.supabaseUserId, supabaseUserId),
				eq(subscriptions.status, "active"),
			),
		);
	return subscription;
};
