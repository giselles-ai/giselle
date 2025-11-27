"use server";

import { revalidatePath } from "next/cache";
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
 * Uses the deactivate action to cancel the subscription immediately.
 *
 * TODO: Add effective_at: { type: "current_billing_period_end" } to cancel
 * at the end of the billing period instead of immediately (like v1's cancel_at_period_end).
 * Currently the API returns "Unknown field" error for effective_at despite SDK type definitions.
 * Waiting for Stripe support response.
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
					// TODO: Add effective_at when Stripe API supports it
					// effective_at: {
					// 	type: "current_billing_period_end",
					// },
				},
			},
		],
	});

	// Step 2: Reserve the billing intent (draft -> pending)
	await stripe.v2.billing.intents.reserve(billingIntent.id);

	// Step 3: Commit the billing intent to execute the deactivation
	await stripe.v2.billing.intents.commit(billingIntent.id);
}

export type CancelSubscriptionResult =
	| { success: true }
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

		await cancelV2Subscription(team.activeSubscriptionId);

		revalidatePath("/settings/team");

		return { success: true };
	} catch (error) {
		console.error("Failed to cancel subscription:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to cancel subscription",
		};
	}
}
