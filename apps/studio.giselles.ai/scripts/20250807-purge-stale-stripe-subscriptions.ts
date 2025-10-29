/**
 * Script to purge stale Stripe subscriptions from the database
 *
 * This maintenance script identifies and removes subscription records from the database
 * that no longer exist in Stripe (e.g., subscriptions that were deleted in Stripe Sandbox
 * but still remain in the database).
 *
 * Usage:
 *   cd apps/studio.giselles.ai
 *   pnpm dlx tsx --env-file=.env.local scripts/20250807-purge-stale-stripe-subscriptions.ts
 */

import readline from "node:readline";
import { inArray } from "drizzle-orm";
import Stripe from "stripe";
import { db, subscriptions } from "@/db";

if (!process.env.STRIPE_SECRET_KEY) {
	throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

// Safety check: Prevent running in production
if (process.env.STRIPE_SECRET_KEY.includes("sk_live_")) {
	console.error("❌ ERROR: This script is for development/sandbox use only!");
	console.error(
		"Production environment detected. Aborting to prevent data loss.",
	);
	process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
	apiVersion: "2025-07-30.basil",
});

// Add delay to avoid hitting Stripe API rate limits
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkSubscriptionExists(
	subscriptionId: string,
): Promise<boolean> {
	try {
		// Wait 100 ms before making the request
		await delay(100);

		// Try to fetch subscription data from Stripe
		await stripe.subscriptions.retrieve(subscriptionId);
		return true;
	} catch (error: unknown) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			typeof (error as { code: unknown }).code === "string"
		) {
			const stripeError = error as { code: string };
			if (stripeError.code === "resource_missing") {
				return false;
			}
		}
		// For other errors, assume subscription exists to be safe
		console.error(`Error checking subscription ${subscriptionId}:`, error);
		return true;
	}
}

async function main() {
	// Get all subscription IDs from database
	const dbSubscriptions = await db.query.subscriptions.findMany();

	console.log(`Found ${dbSubscriptions.length} subscriptions in database`);

	const staleIds: string[] = [];

	// Check each subscription against Stripe
	for (const sub of dbSubscriptions) {
		const exists = await checkSubscriptionExists(sub.id);
		if (!exists) {
			staleIds.push(sub.id);
			console.log(
				`Subscription ${sub.id} no longer exists in Stripe - marking for deletion`,
			);
		} else {
			console.log(`Subscription ${sub.id} still exists in Stripe`);
		}
	}

	if (staleIds.length === 0) {
		console.log("No stale subscriptions found");
		return;
	}

	console.log(`Found ${staleIds.length} stale subscriptions to delete:`);
	console.log(staleIds);

	// Confirm before deletion
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const answer = await new Promise<string>((resolve) => {
		rl.question("Do you want to proceed with deletion? (yes/no): ", resolve);
	});
	rl.close();

	if (answer.toLowerCase() !== "yes") {
		console.log("Deletion cancelled");
		return;
	}

	// Delete stale subscriptions from database
	console.log("Deleting stale subscriptions from database...");

	await db.delete(subscriptions).where(inArray(subscriptions.id, staleIds));

	console.log(`Successfully deleted ${staleIds.length} stale subscriptions`);
}

main()
	.catch((error) => {
		console.error("Purge failed:", error);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
