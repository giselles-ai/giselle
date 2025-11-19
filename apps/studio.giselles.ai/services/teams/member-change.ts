import { getLatestSubscription } from "@/services/subscriptions/queries";
import { reportUserSeatUsage } from "@/services/usage-based-billing";
import type { CurrentTeam } from "./types";

/**
 * Handle team member changes for usage-based billing.
 * Reports user seat usage to Stripe when team membership changes.
 */
export async function handleMemberChange(currentTeam: CurrentTeam) {
	const subscriptionId = currentTeam.activeSubscriptionId;
	if (subscriptionId == null) {
		// No active subscription, nothing to do
		return;
	}
	const customerId = await fetchCustomerId(subscriptionId);
	await reportUserSeatUsage(subscriptionId, customerId);
}

async function fetchCustomerId(subscriptionId: string) {
	const subscription = await getLatestSubscription(subscriptionId);
	if (!subscription) {
		throw new Error(`Subscription ${subscriptionId} not found`);
	}
	return subscription.customerId;
}
