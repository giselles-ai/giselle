/**
 * Handle Stripe Billing Meter webhooks
 *
 * Error codes: https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api#error-codes
 */

import { captureEvent, captureException } from "@sentry/nextjs";
import type Stripe from "stripe";
import { stripe } from "@/services/external/stripe";

const relevantEvents = new Set([
	"v1.billing.meter.error_report_triggered",
	"v1.billing.meter.no_meter_found",
]);

export async function POST(req: Request) {
	const body = await req.text();
	const sig = req.headers.get("stripe-signature") ?? "";
	const webhookSecret = process.env.STRIPE_BILLING_METER_WEBHOOK_SECRET;
	if (!sig || !webhookSecret) {
		return new Response("Webhook secret not found.", { status: 400 });
	}

	let thinEvent: Stripe.ThinEvent;
	try {
		thinEvent = stripe.parseThinEvent(body, sig, webhookSecret);
		console.log(`🔔  Webhook received: ${thinEvent.type}`);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error(`❌ Error parsing webhook: ${message}`);
		captureException(err);
		return new Response(`Webhook Error: ${message}`, { status: 400 });
	}

	if (!relevantEvents.has(thinEvent.type)) {
		return new Response(`Unsupported event type: ${thinEvent.type}`, {
			status: 400,
		});
	}

	let event: Stripe.V2.Event;
	try {
		event = await stripe.v2.core.events.retrieve(thinEvent.id);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error(`❌ Error retrieving event: ${message}`);
		captureException(err);
		return new Response(`Event retrieval error: ${message}`, { status: 500 });
	}
	if (
		event.type !== "v1.billing.meter.error_report_triggered" &&
		event.type !== "v1.billing.meter.no_meter_found"
	) {
		return new Response(`Unexpected event type: ${event.type}`, {
			status: 400,
		});
	}

	try {
		const eventData = event.data;
		const errorReport = [
			"Stripe Billing Meter Error Report:",
			`Period: ${eventData.validation_start} -
  ${eventData.validation_end}`,
			`Summary: ${eventData.developer_message_summary}`,
			`Error Count: ${eventData.reason.error_count}`,
		].join("\n    ");
		console.error(errorReport);

		for (const errorType of eventData.reason.error_types) {
			console.error(
				`Error Type: ${errorType.code} (${errorType.error_count} occurrences)`,
			);
			for (const error of errorType.sample_errors) {
				console.error(`  - ${error.error_message}`);
			}
		}

		let relatedObject: Stripe.Event.RelatedObject | undefined;
		switch (event.type) {
			case "v1.billing.meter.error_report_triggered":
				if (event.related_object) {
					relatedObject = event.related_object;
					console.error("Related Object:");
					console.error(`  ID: ${relatedObject.id}`);
					console.error(`  Type: ${relatedObject.type}`);
					console.error(`  URL: ${relatedObject.url}`);
				}
				break;
			case "v1.billing.meter.no_meter_found":
				break;
			default: {
				const _exhaustiveCheck: never = event;
				throw new Error(`Unhandled event type: ${_exhaustiveCheck}`);
			}
		}

		captureEvent({
			message: "Stripe Billing Meter Error",
			level: "error",
			tags: {
				eventType: event.type,
			},
			extra: {
				validationPeriod: {
					start: eventData.validation_start,
					end: eventData.validation_end,
				},
				summary: eventData.developer_message_summary,
				errorCount: eventData.reason.error_count,
				errorTypes: eventData.reason.error_types.map((errorType) => ({
					code: errorType.code,
					count: errorType.error_count,
					sampleErrors: errorType.sample_errors,
				})),
				relatedObject,
			},
		});
	} catch (error) {
		console.log(error);
		return new Response(
			"Webhook handler failed. View your Next.js function logs.",
			{
				status: 400,
			},
		);
	}
	return new Response(JSON.stringify({ received: true }));
}
