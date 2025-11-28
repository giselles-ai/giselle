import { desc, eq } from "drizzle-orm";
import {
	db,
	stripeBillingCadenceHistories,
	stripePricingPlanSubscriptionHistories,
} from "@/db";

/**
 * Get the latest v2 subscription state for a given subscription ID
 *
 * This function retrieves the most recent record from
 * stripe_pricing_plan_subscription_histories for the specified
 * subscription ID (bpps_xxx), ordered by creation timestamp.
 *
 * @param subscriptionId - Stripe v2 pricing plan subscription ID (e.g., "bpps_1234")
 * @returns The latest subscription record with its billing cadence, or null if not found
 */
export async function getLatestSubscriptionV2(subscriptionId: string) {
	const [latest] = await db
		.select({
			subscription: stripePricingPlanSubscriptionHistories,
			cadence: stripeBillingCadenceHistories,
		})
		.from(stripePricingPlanSubscriptionHistories)
		.innerJoin(
			stripeBillingCadenceHistories,
			eq(
				stripePricingPlanSubscriptionHistories.billingCadenceDbId,
				stripeBillingCadenceHistories.dbId,
			),
		)
		.where(eq(stripePricingPlanSubscriptionHistories.id, subscriptionId))
		.orderBy(desc(stripePricingPlanSubscriptionHistories.createdAt))
		.limit(1);

	return latest ?? null;
}
