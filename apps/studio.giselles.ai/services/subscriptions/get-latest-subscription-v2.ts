import { desc, eq } from "drizzle-orm";
import {
	db,
	stripeBillingCadenceHistories,
	stripeBillingPricingPlanSubscriptionHistories,
} from "@/db";

/**
 * Get the latest v2 subscription state for a given subscription ID
 *
 * This function retrieves the most recent record from
 * stripe_billing_pricing_plan_subscription_histories for the specified
 * subscription ID (bpps_xxx), ordered by creation timestamp.
 *
 * @param subscriptionId - Stripe v2 pricing plan subscription ID (e.g., "bpps_1234")
 * @returns The latest subscription record with its billing cadence, or null if not found
 */
export async function getLatestSubscriptionV2(subscriptionId: string) {
	const [latest] = await db
		.select({
			subscription: stripeBillingPricingPlanSubscriptionHistories,
			cadence: stripeBillingCadenceHistories,
		})
		.from(stripeBillingPricingPlanSubscriptionHistories)
		.innerJoin(
			stripeBillingCadenceHistories,
			eq(
				stripeBillingPricingPlanSubscriptionHistories.billingCadenceDbId,
				stripeBillingCadenceHistories.dbId,
			),
		)
		.where(eq(stripeBillingPricingPlanSubscriptionHistories.id, subscriptionId))
		.orderBy(desc(stripeBillingPricingPlanSubscriptionHistories.createdAt))
		.limit(1);

	return latest ?? null;
}
