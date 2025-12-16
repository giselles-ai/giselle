"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserRole } from "@/app/(main)/settings/team/actions";
import { logger } from "@/lib/logger";
import { stripe } from "@/services/external/stripe";
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
 * Uses the deactivate action to cancel the subscription at the end of the current billing period.
 */
async function cancelV2Subscription(subscriptionId: string): Promise<void> {
	// Step 1: Create a billing intent with deactivate action
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
	logger.debug(
		{ billingIntent },
		"[cancel-subscription] Billing intent created",
	);

	// Step 2: Reserve the billing intent (draft -> pending)
	const reservedIntent = await stripe.v2.billing.intents.reserve(
		billingIntent.id,
	);
	logger.debug(
		{ reservedIntent },
		"[cancel-subscription] Billing intent reserved",
	);

	// Step 3: Commit the billing intent to execute the deactivation
	const committedIntent = await stripe.v2.billing.intents.commit(
		billingIntent.id,
	);
	logger.debug(
		{ committedIntent },
		"[cancel-subscription] Billing intent committed",
	);
}

export type CancelSubscriptionResult =
	| { success: true; willCancelAt: string | null }
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
			"[cancel-subscription] Cancelling v2 subscription",
		);

		await cancelV2Subscription(team.activeSubscriptionId);

		// Retrieve the subscription to get the scheduled cancellation date
		const subscription =
			await stripe.v2.billing.pricingPlanSubscriptions.retrieve(
				team.activeSubscriptionId,
			);
		const willCancelAt =
			subscription.servicing_status_transitions?.will_cancel_at ?? null;

		logger.info(
			{
				subscriptionId: team.activeSubscriptionId,
				teamDbId: team.dbId,
				willCancelAt,
			},
			"[cancel-subscription] Subscription cancelled successfully",
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
