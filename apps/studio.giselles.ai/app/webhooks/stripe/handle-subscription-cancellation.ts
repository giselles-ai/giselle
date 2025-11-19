import { and, eq, ne } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db/db";
import { teamMemberships, teams } from "@/db/schema";
import { getLatestSubscription } from "@/services/subscriptions/get-latest-subscription";

export async function handleSubscriptionCancellation(
	subscription: Stripe.Subscription,
) {
	if (subscription.status !== "canceled") {
		return;
	}

	// Get the team_db_id from subscription history
	const sub = await getLatestSubscription(subscription.id);

	if (!sub) {
		throw new Error(
			`Subscription record not found in database: ${subscription.id}`,
		);
	}

	const [team] = await db
		.select({ plan: teams.plan })
		.from(teams)
		.where(eq(teams.dbId, sub.teamDbId))
		.limit(1);

	if (!team) {
		throw new Error(`Team not found (id: ${sub.teamDbId})`);
	}

	let shouldApplyStripeCancellation =
		team.plan !== "internal" && team.plan !== "enterprise";
	// Enterprise and internal plans are not managed in Stripe, so cancellation webhooks should never mutate those teams.

	if (shouldApplyStripeCancellation) {
		const [latestTeam] = await db
			.select({ plan: teams.plan })
			.from(teams)
			.where(eq(teams.dbId, sub.teamDbId))
			.limit(1);

		if (!latestTeam) {
			throw new Error(`Team not found (id: ${sub.teamDbId})`);
		}

		shouldApplyStripeCancellation =
			latestTeam.plan !== "internal" && latestTeam.plan !== "enterprise";
	}

	if (shouldApplyStripeCancellation) {
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

	await db
		.update(teams)
		.set({
			plan: "free",
			activeSubscriptionId: null,
			activeCustomerId: null,
		})
		.where(
			and(
				eq(teams.dbId, sub.teamDbId),
				eq(teams.activeSubscriptionId, subscription.id),
				ne(teams.plan, "internal"),
				ne(teams.plan, "enterprise"),
			),
		);
}
