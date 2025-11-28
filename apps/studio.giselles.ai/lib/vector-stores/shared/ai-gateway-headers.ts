import type { TeamWithSubscription } from "@/services/teams";

/**
 * Build AI Gateway headers for billing attribution.
 * This function creates headers required for AI Gateway requests,
 * including Stripe customer ID for usage tracking.
 */
export function buildAiGatewayHeaders(
	team: TeamWithSubscription | null,
): Record<string, string> | undefined {
	const headers: Record<string, string> = {
		"http-referer":
			process.env.AI_GATEWAY_HTTP_REFERER ?? "https://giselles.ai",
		"x-title": process.env.AI_GATEWAY_X_TITLE ?? "Giselle",
	};

	const stripeCustomerId = team?.activeCustomerId ?? undefined;
	if (stripeCustomerId !== undefined) {
		headers["stripe-customer-id"] = stripeCustomerId;
		headers["stripe-restricted-access-key"] =
			process.env.STRIPE_AI_GATEWAY_RESTRICTED_ACCESS_KEY ?? "";
	} else if (team?.plan === "pro" || team?.plan === "team") {
		console.warn(
			`Stripe customer ID not found for vector store ingest (team: ${team?.id})`,
		);
	}

	return headers;
}
