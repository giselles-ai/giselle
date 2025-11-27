import type Stripe from "stripe";
import { logger } from "@/lib/logger";
import { stripe } from "@/services/external/stripe";

const relevantEvents = new Set([
	"v2.billing.pricing_plan_subscription.servicing_activated",
	"v2.billing.pricing_plan_subscription.servicing_canceled",
]);

export async function POST(req: Request) {
	const body = await req.text();
	const sig = req.headers.get("stripe-signature");
	const webhookSecret = process.env.STRIPE_V2_WEBHOOK_SECRET;
	let event: Stripe.Event;

	try {
		if (!webhookSecret) {
			return new Response("Webhook secret not configured.", { status: 400 });
		}
		if (!sig) {
			return new Response("Missing stripe-signature header.", { status: 400 });
		}
		event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
		logger.info({ eventType: event.type }, "[stripe-v2-webhook] Received");
		logger.debug({ event }, "[stripe-v2-webhook] Event payload");
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		const errorName = error instanceof Error ? error.name : "UnknownError";
		logger.error({ errorName, message }, "[stripe-v2-webhook] Error");
		return new Response(`Webhook Error: ${message}`, { status: 400 });
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
			// TODO: Implement handler in future PR
			logger.info(
				"[stripe-v2-webhook] Pricing plan subscription activated (handler pending)",
			);
			logger.debug(
				{ eventData: event.data },
				"[stripe-v2-webhook] Activation event data",
			);
			return new Response(JSON.stringify({ received: true }));
		}

		if (
			eventType === "v2.billing.pricing_plan_subscription.servicing_canceled"
		) {
			// TODO: Implement handler in future PR
			logger.info(
				"[stripe-v2-webhook] Pricing plan subscription canceled (handler pending)",
			);
			logger.debug(
				{ eventData: event.data },
				"[stripe-v2-webhook] Cancellation event data",
			);
			return new Response(JSON.stringify({ received: true }));
		}

		throw new Error("Unhandled relevant event!");
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		const errorName = error instanceof Error ? error.name : "UnknownError";
		logger.error({ errorName, message }, "[stripe-v2-webhook] Handler failed");
		return new Response(
			"Webhook handler failed. View your Next.js function logs.",
			{
				status: 400,
			},
		);
	}
}
