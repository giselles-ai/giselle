import { and, eq, ne } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db/db";
import { activeSubscriptions, subscriptionHistory, teamMemberships } from "@/db/schema";

export async function handleSubscriptionCancellation(
	subscription: Stripe.Subscription,
) {
	if (subscription.status !== "canceled") {
		return;
	}

	// Get the team_db_id from active subscriptions or history table
	const [activeSub] = await db
		.select({ teamDbId: activeSubscriptions.teamDbId })
		.from(activeSubscriptions)
		.where(eq(activeSubscriptions.id, subscription.id))
		.limit(1);

	const [historySub] = await db
		.select({ teamDbId: subscriptionHistory.teamDbId })
		.from(subscriptionHistory)
		.where(eq(subscriptionHistory.id, subscription.id))
		.limit(1);

	const sub = activeSub ?? historySub;

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
