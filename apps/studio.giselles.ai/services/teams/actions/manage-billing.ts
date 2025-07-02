"use server";

import { redirect } from "next/navigation";
import invariant from "tiny-invariant";
import { stripe } from "@/services/external/stripe";

export async function manageBilling(subscriptionId: string) {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
	invariant(siteUrl, "NEXT_PUBLIC_SITE_URL is not set");

	const subscription = await stripe.subscriptions.retrieve(subscriptionId);
	const session = await stripe.billingPortal.sessions.create({
		customer: subscription.customer as string,
		return_url: `${siteUrl}/settings/team`,
	});

	redirect(session.url);
}
