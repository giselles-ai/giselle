import invariant from "tiny-invariant";
import { stripe } from "@/services/external/stripe/config";

export async function createCheckoutSessionV2(
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

	const checkoutSession = await stripe.checkout.sessions.create(
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
			apiVersion: "2025-11-17.preview;checkout_product_catalog_preview=v1",
		},
	);

	if (checkoutSession.url == null) {
		throw new Error("checkoutSession.url is null");
	}

	return { id: checkoutSession.id, url: checkoutSession.url };
}
