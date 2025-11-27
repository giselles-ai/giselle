"use server";

import { redirect } from "next/navigation";
import invariant from "tiny-invariant";
import { stripe } from "@/services/external/stripe";

/**
 * v2 Billing Cadence response type (minimal fields needed)
 */
interface BillingCadence {
	id: string;
	payer: {
		customer: string;
	};
}

/**
 * Retrieve customer ID from v2 pricing plan subscription
 * v2 subscriptions require: subscription -> billing_cadence -> payer.customer
 */
async function getCustomerIdFromV2Subscription(
	subscriptionId: string,
): Promise<string> {
	// Step 1: Get the pricing plan subscription to get billing_cadence ID
	const subscriptionResponse = await fetch(
		`https://api.stripe.com/v2/billing/pricing_plan_subscriptions/${subscriptionId}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
				"Stripe-Version": "2025-11-17.preview",
			},
		},
	);

	if (!subscriptionResponse.ok) {
		const error = await subscriptionResponse.text();
		throw new Error(`Failed to retrieve v2 subscription: ${error}`);
	}

	const subscription = await subscriptionResponse.json();
	const billingCadenceId = subscription.billing_cadence;

	// Step 2: Get the billing cadence to get customer ID
	const cadenceResponse = await fetch(
		`https://api.stripe.com/v2/billing/cadences/${billingCadenceId}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
				"Stripe-Version": "2025-11-17.preview",
			},
		},
	);

	if (!cadenceResponse.ok) {
		const error = await cadenceResponse.text();
		throw new Error(`Failed to retrieve billing cadence: ${error}`);
	}

	const cadence: BillingCadence = await cadenceResponse.json();
	return cadence.payer.customer;
}

/**
 * Check if the subscription ID is a v2 pricing plan subscription
 * v2 pricing plan subscription IDs start with "bpps_"
 */
function isV2PricingPlanSubscription(subscriptionId: string): boolean {
	return subscriptionId.startsWith("bpps_");
}

export async function manageBilling(subscriptionId: string) {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
	invariant(siteUrl, "NEXT_PUBLIC_SITE_URL is not set");

	let customerId: string;

	if (isV2PricingPlanSubscription(subscriptionId)) {
		// v2 pricing plan subscription: use v2 API to get customer ID
		customerId = await getCustomerIdFromV2Subscription(subscriptionId);
	} else {
		// v1 subscription: use existing v1 API
		const subscription = await stripe.subscriptions.retrieve(subscriptionId);
		customerId = subscription.customer as string;
	}

	const session = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: `${siteUrl}/settings/team`,
	});

	redirect(session.url);
}
