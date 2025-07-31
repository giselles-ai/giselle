import type Stripe from "stripe";
import { stripe } from "@/services/external/stripe";

export async function handleInvoiceCreation(invoice: Stripe.Invoice) {
	const subscription = await fetchSubscriptionFromInvoice(invoice);
	if (subscription == null) {
		throw new Error("No subscription found in the invoice.");
	}

	if (subscription.status !== "canceled") {
		return;
	}

	// When a subscription is canceled, we should charge for usage-based billing from the previous billing cycle. The final invoice, which includes these charges, will be automatically created but will not be processed for payment. Therefore, we need to handle this case manually.
	if (!invoice.id) {
		throw new Error("Invoice ID is missing");
	}
	await stripe.invoices.pay(invoice.id);
}

async function fetchSubscriptionFromInvoice(
	invoice: Stripe.Invoice,
): Promise<Stripe.Subscription | null> {
	const parent = invoice.parent;

	if (parent?.type !== "subscription_details") {
		return null;
	}
	const givenSubscription = parent.subscription_details?.subscription;
	if (givenSubscription == null) {
		return null;
	}

	if (typeof givenSubscription === "string") {
		return await stripe.subscriptions.retrieve(givenSubscription);
	} else {
		return givenSubscription;
	}
}
