import { and, eq, ne } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/drizzle/db";
import { subscriptions, teamMemberships } from "@/drizzle/schema";

export async function handleSubscriptionCancellation(
	subscription: Stripe.Subscription,
) {
	if (subscription.status !== "canceled") {
		return;
	}

	// Get the team_db_id from subscriptions table
	const [sub] = await db
		.select({ teamDbId: subscriptions.teamDbId })
		.from(subscriptions)
		.where(eq(subscriptions.id, subscription.id))
		.limit(1);

	if (!sub) {
		throw new Error(
			`Subscription record not found in database: ${subscription.id}`,
		);
	}

	// Get the earliest admin's membership ID
	const [earliestAdmin] = await db
		.select({ id: teamMemberships.id })
		.from(teamMemberships)
		.where(
			and(
				eq(teamMemberships.teamDbId, sub.teamDbId),
				eq(teamMemberships.role, "admin"),
			),
		)
		.orderBy(teamMemberships.id)
		.limit(1);

	if (!earliestAdmin) {
		throw new Error(`No admin found for team (id: ${sub.teamDbId})`);
	}

	// Delete all team memberships except the earliest admin
	await db
		.delete(teamMemberships)
		.where(
			and(
				eq(teamMemberships.teamDbId, sub.teamDbId),
				ne(teamMemberships.id, earliestAdmin.id),
			),
		);
}
