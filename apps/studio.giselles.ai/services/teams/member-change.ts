import { reportUserSeatUsage } from "@/services/usage-based-billing";
import type { CurrentTeam } from "./types";

/**
 * Handle team member changes for usage-based billing.
 * Reports user seat usage to Stripe when team membership changes.
 */
export async function handleMemberChange(currentTeam: CurrentTeam) {
	const subscriptionId = currentTeam.activeSubscriptionId;
	const customerId = currentTeam.activeCustomerId;
	if (subscriptionId == null || customerId == null) {
		// No active subscription, nothing to do
		return;
	}
	await reportUserSeatUsage(subscriptionId, customerId);
}
