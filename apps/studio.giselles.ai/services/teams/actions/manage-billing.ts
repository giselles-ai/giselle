"use server";

import { redirect } from "next/navigation";
import invariant from "tiny-invariant";
import { stripe } from "@/services/external/stripe";

/**
 * Opens the Stripe billing portal for a subscription
 *
 * Automatically detects v1 (sub_xxx) or v2 (bpps_xxx) subscription IDs
 * and uses the appropriate API to retrieve customer information.
 */
export async function manageBilling(subscriptionId: string) {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
	invariant(siteUrl, "NEXT_PUBLIC_SITE_URL is not set");

	// Detect v2 pricing plan subscription (bpps_xxx format)
	const isV2Subscription = subscriptionId.startsWith("bpps_");

	let customerId: string;

	if (isV2Subscription) {
		// v2: Get customer ID from billing cadence
		const subscription =
			await stripe.v2.billing.pricingPlanSubscriptions.retrieve(subscriptionId);
		const cadence = await stripe.v2.billing.cadences.retrieve(
			subscription.billing_cadence,
		);
		const customer = cadence.payer.customer;
		if (!customer) {
			throw new Error(
				`Customer ID not found in cadence.payer for subscription ${subscriptionId}`,
			);
		}
		customerId = customer;
	} else {
		// v1: Get customer ID directly from subscription
		const subscription = await stripe.subscriptions.retrieve(subscriptionId);
		customerId = subscription.customer as string;
	}

	const session = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: `${siteUrl}/settings/team`,
	});

	redirect(session.url);
}
