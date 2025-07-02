import type Stripe from "stripe";
import { stripe } from "@/services/external/stripe";

export async function handleInvoiceCreation(invoice: Stripe.Invoice) {
	if (!invoice.subscription || typeof invoice.subscription !== "string") {
		throw new Error(
			"Invoice is missing a subscription ID. Please check the invoice data.",
		);
	}

	const subscription = await stripe.subscriptions.retrieve(
		invoice.subscription,
	);

	if (subscription.status !== "canceled") {
		return;
	}

	// When a subscription is canceled, we should charge for usage-based billing from the previous billing cycle. The final invoice, which includes these charges, will be automatically created but will not be processed for payment. Therefore, we need to handle this case manually.
	await stripe.invoices.pay(invoice.id);
}
