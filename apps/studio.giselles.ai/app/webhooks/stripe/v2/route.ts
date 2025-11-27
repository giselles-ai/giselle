import type Stripe from "stripe";
import { stripe } from "@/services/external/stripe";
import {
	handlePricingPlanServicingActivated,
	handlePricingPlanServicingCanceled,
} from "../handle-pricing-plan-subscription";

const relevantEvents = new Set([
	"v2.billing.pricing_plan_subscription.servicing_activated",
	"v2.billing.pricing_plan_subscription.servicing_canceled",
]);

export async function POST(req: Request) {
	const body = await req.text();
	const sig = req.headers.get("stripe-signature") as string;
	const webhookSecret = process.env.STRIPE_V2_WEBHOOK_SECRET;
	let event: Stripe.Event;

	try {
		if (!sig || !webhookSecret)
			return new Response("Webhook secret not found.", { status: 400 });
		event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
		console.log(`🔔  v2 Webhook received: ${event.type}`);

		// biome-ignore lint/suspicious/noExplicitAny: @todo error handling
	} catch (err: any) {
		console.log(`❌ Error message: ${err.message}`);
		return new Response(`Webhook Error: ${err.message}`, { status: 400 });
	}

	if (!relevantEvents.has(event.type)) {
		return new Response(`Unsupported event type: ${event.type}`, {
			status: 400,
		});
	}

	try {
		const eventType = event.type as string;
		if (
			eventType === "v2.billing.pricing_plan_subscription.servicing_activated"
		) {
			await handlePricingPlanServicingActivated(event);
			return new Response(JSON.stringify({ received: true }));
		}

		if (
			eventType === "v2.billing.pricing_plan_subscription.servicing_canceled"
		) {
			await handlePricingPlanServicingCanceled(event);
			return new Response(JSON.stringify({ received: true }));
		}

		throw new Error("Unhandled relevant event!");
	} catch (error) {
		console.log(error);
		return new Response(
			"Webhook handler failed. View your Next.js function logs.",
			{
				status: 400,
			},
		);
	}
}
