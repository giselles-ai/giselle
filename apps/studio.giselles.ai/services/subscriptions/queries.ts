import { desc, eq } from "drizzle-orm";
import { db, subscriptionHistories } from "@/db";

/**
 * Get the latest subscription state for a given subscription ID
 *
 * This function retrieves the most recent record from subscription_histories
 * for the specified subscription ID, ordered by creation timestamp.
 *
 * @param subscriptionId - Stripe subscription ID (e.g., "sub_1234")
 * @returns The latest subscription record, or null if not found
 */
export async function getLatestSubscription(subscriptionId: string) {
	const [latest] = await db
		.select()
		.from(subscriptionHistories)
		.where(eq(subscriptionHistories.id, subscriptionId))
		.orderBy(desc(subscriptionHistories.createdAt))
		.limit(1);

	return latest || null;
}
