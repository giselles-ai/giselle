import { getCache } from "@vercel/functions";
import type Stripe from "stripe";
import { stripe } from "./config";

// Promise cache to prevent duplicate concurrent API calls
const inFlightPromises = new Map<string, Promise<Stripe.Price>>();

/**
 * Retrieve a Stripe Price with a Runtime Cache layer.
 * - Uses Vercel Runtime Cache API when available.
 * - Falls back to direct Stripe API if cache is unavailable.
 */
export function getCachedPrice(priceId: string): Promise<Stripe.Price> {
	const inFlight = inFlightPromises.get(priceId);
	if (inFlight) {
		return inFlight;
	}

	const fetchPromise = (async () => {
		try {
			return await withCache(
				`stripe:price:${priceId}`,
				{
					ttl: 3600,
					tags: ["stripe:price", `stripe:price:${priceId}`],
				},
				async () => stripe.prices.retrieve(priceId),
			);
		} finally {
			inFlightPromises.delete(priceId);
		}
	})();
	inFlightPromises.set(priceId, fetchPromise);

	return fetchPromise;
}

async function withCache(
	cacheKey: string,
	options: { ttl: number; tags: string[] },
	fetchFn: () => Promise<Stripe.Price>,
): Promise<Stripe.Price> {
	const cache = getCache();

	try {
		const cached = await cache.get(cacheKey);
		if (cached) {
			return cached as Stripe.Price;
		}
	} catch {
		// Cache read failed, continue to fetch
	}

	const result = await fetchFn();

	try {
		await cache.set(cacheKey, result, options);
	} catch {
		// Cache write failed, ignore
	}

	return result;
}
