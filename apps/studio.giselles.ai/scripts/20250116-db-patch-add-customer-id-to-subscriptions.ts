import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db, subscriptions } from "@/drizzle";

if (!process.env.STRIPE_SECRET_KEY) {
	throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
	apiVersion: "2025-07-30.basil",
});

// Add delay to avoid hitting Stripe API rate limits
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function updateSubscriptionCustomerId(
	sub: typeof subscriptions.$inferSelect,
) {
	try {
		// Wait 100 ms before making the request
		await delay(100);

		// Fetch subscription data from Stripe
		const stripeSubscription = await stripe.subscriptions.retrieve(sub.id);

		// Extract customer_id from the subscription
		// customer can be either a string (customer ID) or a Customer object
		const customerId =
			typeof stripeSubscription.customer === "string"
				? stripeSubscription.customer
				: stripeSubscription.customer.id;

		// Update our database with the customer_id
		await db
			.update(subscriptions)
			.set({ customerId })
			.where(eq(subscriptions.dbId, sub.dbId));

		console.log(
			`Updated subscription ${sub.id} with customer_id ${customerId}`,
		);
	} catch (error: unknown) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			typeof (error as { code: unknown }).code === "string"
		) {
			const stripeError = error as { code: string };
			if (stripeError.code === "resource_missing") {
				console.log(
					`Subscription ${sub.id} no longer exists in Stripe - skipping update`,
				);
			} else {
				console.error(`Failed to update subscription ${sub.id}:`, error);
			}
		} else {
			console.error(`Failed to update subscription ${sub.id}:`, error);
		}
	}
}

async function main() {
	// Find all subscriptions that don't have a customer_id set
	const subsWithoutCustomerId = await db.query.subscriptions.findMany({
		where: (subscriptions, { isNull }) => isNull(subscriptions.customerId),
	});

	console.log(
		`Found ${subsWithoutCustomerId.length} subscriptions without customer_id`,
	);

	// Process all subscriptions, waiting between each request
	for (const sub of subsWithoutCustomerId) {
		await updateSubscriptionCustomerId(sub);
	}

	console.log("Successfully updated all subscriptions with customer_id");
}

main()
	.catch((error) => {
		console.error("Migration failed:", error);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
