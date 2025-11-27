import invariant from "tiny-invariant";
import { stripe } from "@/services/external/stripe/config";

export async function createCheckoutSession(
	subscriptionMetadata: Record<string, string>,
	successUrl: string,
	cancelUrl: string,
) {
	const pricingPlanId = process.env.STRIPE_PRO_PRICING_PLAN_ID;
	const licenseFeeComponentId = process.env.STRIPE_PRO_LICENSE_FEE_COMPONENT_ID;

	invariant(pricingPlanId, "STRIPE_PRO_PRICING_PLAN_ID is not set");
	invariant(
		licenseFeeComponentId,
		"STRIPE_PRO_LICENSE_FEE_COMPONENT_ID is not set",
	);

	// Using preview API for pricing plans - requires special apiVersion header
	// Note: User seat metering should be configured as a rate card component in the pricing plan
	// biome-ignore lint/suspicious/noExplicitAny: checkout_items is a preview API for pricing plans
	const checkoutSession = await (stripe.checkout.sessions.create as any)(
		{
			checkout_items: [
				{
					type: "pricing_plan_subscription_item",
					pricing_plan_subscription_item: {
						pricing_plan: pricingPlanId,
						component_configurations: {
							[licenseFeeComponentId]: {
								type: "license_fee_component",
								license_fee_component: { quantity: 1 },
							},
						},
						metadata: subscriptionMetadata,
					},
				},
			],
			automatic_tax: { enabled: true },
			success_url: successUrl,
			cancel_url: cancelUrl,
		},
		{
			apiVersion: "2025-11-17.clover;checkout_product_catalog_preview=v1",
		},
	);

	if (checkoutSession.url == null) {
		throw new Error("checkoutSession.url is null");
	}

	return { id: checkoutSession.id, url: checkoutSession.url };
}
