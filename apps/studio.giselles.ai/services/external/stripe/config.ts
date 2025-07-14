import { Stripe } from "stripe";
import { stripeBasilMigrationFlag } from "@/flags";

let stripeAcaciaInstance: Stripe | null = null;
let stripeBasilInstance: Stripe | null = null;

function getStripeAcaciaInstance(): Stripe {
	if (!stripeAcaciaInstance) {
		const key = process.env.STRIPE_SECRET_KEY;
		if (!key) {
			throw new Error("STRIPE_SECRET_KEY is not configured");
		}

		stripeAcaciaInstance = new Stripe(key, {
			// https://github.com/stripe/stripe-node#configuration
			apiVersion: "2024-11-20.acacia",
		});
	}
	return stripeAcaciaInstance;
}

function getStripeBasilInstance(): Stripe {
	if (!stripeBasilInstance) {
		const key = process.env.STRIPE_SECRET_KEY;
		if (!key) {
			throw new Error("STRIPE_SECRET_KEY is not configured");
		}

		stripeBasilInstance = new Stripe(key, {
			// https://github.com/stripe/stripe-node#configuration
			// @ts-expect-error - Basil is a preview API version not yet in TypeScript definitions
			apiVersion: "2025-03-31.basil",
		});
	}
	return stripeBasilInstance;
}

async function getStripeInstance(): Promise<Stripe> {
	const useBasil = await stripeBasilMigrationFlag();
	console.log(
		`[Stripe] Using API version: ${useBasil ? "2025-03-31.basil" : "2024-11-20.acacia"}`,
	);

	return useBasil ? getStripeBasilInstance() : getStripeAcaciaInstance();
}

const handler: ProxyHandler<Stripe> = {
	get: (_target, prop: string | symbol) => {
		// Handle async initialization
		if (prop === "then" || prop === Symbol.toStringTag) {
			return undefined;
		}

		const propKey = prop as keyof Stripe;

		return async (...args: unknown[]) => {
			const instance = await getStripeInstance();
			const value = instance[propKey];

			if (typeof value === "function") {
				// Type assertion for method binding
				return (value as (...args: unknown[]) => unknown).apply(instance, args);
			}
			return value;
		};
	},
};

export const stripe: Stripe = new Proxy(new Stripe("dummy"), handler);
