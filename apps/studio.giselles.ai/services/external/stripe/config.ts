import { Stripe } from "stripe";

let stripeInstance: Stripe | null = null;

const handler: ProxyHandler<Stripe> = {
	get: (_target, prop: keyof Stripe | symbol) => {
		if (!stripeInstance) {
			const key = process.env.STRIPE_SECRET_KEY;
			if (!key) {
				throw new Error("STRIPE_SECRET_KEY is not configured");
			}
			stripeInstance = new Stripe(key, {
				// https://github.com/stripe/stripe-node#configuration
				apiVersion: "2025-07-30.basil",
			});
		}
		return stripeInstance[prop as keyof Stripe];
	},
};

export const stripe: Stripe = new Proxy(new Stripe("dummy"), handler);
