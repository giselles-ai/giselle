import { and, eq, ne } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db/db";
import { teamMemberships, teams } from "@/db/schema";
import { getLatestSubscriptionV2 } from "@/services/subscriptions/get-latest-subscription-v2";

export async function handleSubscriptionCancellation(
	subscription: Stripe.Subscription,
) {
	if (subscription.status !== "canceled") {
		return;
	}

	// Get the team_db_id from subscription history
	const result = await getLatestSubscriptionV2(subscription.id);

	if (!result) {
		throw new Error(
			`Subscription record not found in database: ${subscription.id}`,
		);
	}

	const teamDbId = result.subscription.teamDbId;

	const [team] = await db
		.select({ plan: teams.plan })
		.from(teams)
		.where(eq(teams.dbId, teamDbId))
		.limit(1);

	if (!team) {
		throw new Error(`Team not found (id: ${teamDbId})`);
	}

	let shouldApplyStripeCancellation =
		team.plan !== "internal" && team.plan !== "enterprise";
	// Enterprise and internal plans are not managed in Stripe, so cancellation webhooks should never mutate those teams.

	if (shouldApplyStripeCancellation) {
		const [latestTeam] = await db
			.select({ plan: teams.plan })
			.from(teams)
			.where(eq(teams.dbId, teamDbId))
			.limit(1);

		if (!latestTeam) {
			throw new Error(`Team not found (id: ${teamDbId})`);
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
					eq(teamMemberships.teamDbId, teamDbId),
					eq(teamMemberships.role, "admin"),
				),
			)
			.orderBy(teamMemberships.id)
			.limit(1);

		if (!earliestAdmin) {
			throw new Error(`No admin found for team (id: ${teamDbId})`);
		}

		// Delete all team memberships except the earliest admin
		await db
			.delete(teamMemberships)
			.where(
				and(
					eq(teamMemberships.teamDbId, teamDbId),
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
				eq(teams.dbId, teamDbId),
				eq(teams.activeSubscriptionId, subscription.id),
				ne(teams.plan, "internal"),
				ne(teams.plan, "enterprise"),
			),
		);
}
