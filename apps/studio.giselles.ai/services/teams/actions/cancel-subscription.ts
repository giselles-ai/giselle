"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserRole } from "@/app/(main)/settings/team/actions";
import { db } from "@/db";
import { logger } from "@/lib/logger";
import { stripe } from "@/services/external/stripe";
import { recordV2SubscriptionHistory } from "@/services/subscriptions/record-v2-subscription-history";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";

/**
 * Check if the subscription ID is a v2 pricing plan subscription
 * v2 pricing plan subscription IDs start with "bpps_"
 */
function isV2PricingPlanSubscription(subscriptionId: string): boolean {
	return subscriptionId.startsWith("bpps_");
}

/**
 * Cancel a v2 pricing plan subscription using Stripe Billing Intent API
 *
 * Schedules the subscription to be cancelled at the end of the current billing period.
 * Returns the scheduled cancellation date.
 */
async function cancelV2Subscription(
	subscriptionId: string,
	teamDbId: number,
): Promise<{ willCancelAt: Date }> {
	// Step 1: Create a billing intent with deactivate action (scheduled for billing period end)
	const billingIntent = await stripe.v2.billing.intents.create({
		currency: "usd",
		actions: [
			{
				type: "deactivate",
				deactivate: {
					type: "pricing_plan_subscription_details",
					pricing_plan_subscription_details: {
						pricing_plan_subscription: subscriptionId,
					},
					effective_at: {
						type: "current_billing_period_end",
					},
				},
			},
		],
	});

	// Step 2: Reserve the billing intent (draft -> pending)
	await stripe.v2.billing.intents.reserve(billingIntent.id);

	// Step 3: Commit the billing intent to execute the deactivation
	await stripe.v2.billing.intents.commit(billingIntent.id);

	// Step 4: Retrieve the subscription to get the scheduled cancellation date
	const subscription =
		await stripe.v2.billing.pricingPlanSubscriptions.retrieve(subscriptionId);

	const willCancelAtStr =
		subscription.servicing_status_transitions.will_cancel_at;
	if (!willCancelAtStr) {
		throw new Error(
			"Subscription cancellation was scheduled but will_cancel_at was not returned",
		);
	}
	const willCancelAt = new Date(willCancelAtStr);

	// Step 5: Retrieve the billing cadence and record subscription history
	const cadence = await stripe.v2.billing.cadences.retrieve(
		subscription.billing_cadence,
	);

	await db.transaction(async (tx) => {
		await recordV2SubscriptionHistory(tx, subscription, cadence, teamDbId);
	});

	return { willCancelAt };
}

export type CancelSubscriptionResult =
	| { success: true; willCancelAt: Date }
	| { success: false; error: string };

/**
 * Cancel subscription action
 *
 * Only supports v2 pricing plan subscriptions (bpps_xxx).
 * v1 subscriptions should be cancelled via Stripe Billing Portal.
 */
export async function cancelSubscription(): Promise<CancelSubscriptionResult> {
	try {
		const team = await fetchCurrentTeam();

		// Check if user is admin
		const currentUserRoleResult = await getCurrentUserRole();
		if (
			!currentUserRoleResult.success ||
			currentUserRoleResult.data !== "admin"
		) {
			return {
				success: false,
				error: "Only admin users can cancel subscriptions",
			};
		}

		if (!isProPlan(team)) {
			return {
				success: false,
				error: "Only Pro plan teams can cancel subscriptions",
			};
		}

		if (!team.activeSubscriptionId) {
			return {
				success: false,
				error: "No active subscription found",
			};
		}

		if (!isV2PricingPlanSubscription(team.activeSubscriptionId)) {
			return {
				success: false,
				error:
					"This subscription type cannot be cancelled here. Please use Manage Subscription.",
			};
		}

		logger.info(
			{ subscriptionId: team.activeSubscriptionId, teamDbId: team.dbId },
			"[cancel-subscription] Scheduling v2 subscription cancellation",
		);

		const { willCancelAt } = await cancelV2Subscription(
			team.activeSubscriptionId,
			team.dbId,
		);

		logger.info(
			{
				subscriptionId: team.activeSubscriptionId,
				teamDbId: team.dbId,
				willCancelAt,
			},
			"[cancel-subscription] Subscription cancellation scheduled successfully",
		);

		revalidatePath("/settings/team");

		return { success: true, willCancelAt };
	} catch (error) {
		logger.error(
			{ error },
			"[cancel-subscription] Failed to cancel subscription",
		);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to cancel subscription",
		};
	}
}
