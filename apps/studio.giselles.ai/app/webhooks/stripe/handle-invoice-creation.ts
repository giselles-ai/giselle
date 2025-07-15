import type Stripe from "stripe";
import { stripe } from "@/services/external/stripe";

export async function handleInvoiceCreation(invoice: Stripe.Invoice) {
	// In Basil API, subscription ID is in the parent field
	// Type assertion for parent field structure
	const parent = invoice.parent as { id: string; object: string } | null;
	const subscriptionId = parent?.id;

	if (!subscriptionId || parent?.object !== "subscription") {
		throw new Error(
			"Invoice is missing a subscription ID. Please check the invoice data.",
		);
	}

	const subscription = await stripe.subscriptions.retrieve(subscriptionId);

	if (subscription.status !== "canceled") {
		return;
	}

	// When a subscription is canceled, we should charge for usage-based billing from the previous billing cycle. The final invoice, which includes these charges, will be automatically created but will not be processed for payment. Therefore, we need to handle this case manually.
	if (!invoice.id) {
		throw new Error("Invoice ID is missing");
	}
	await stripe.invoices.pay(invoice.id);
}
