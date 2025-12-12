// https://supabase.com/docs/guides/auth/redirect-urls
import type { OAuthProvider } from "@/services/accounts";

const DEFAULT_ORIGIN = "http://localhost:3000";

/** Returns the site origin from NEXT_PUBLIC_SITE_URL or falls back to localhost */
export function getSiteOrigin(): string {
	const origin = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_ORIGIN;
	return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

export function getAuthCallbackUrl({
	next = "/",
	provider,
}: {
	next: string;
	provider: OAuthProvider;
}): string {
	return `${getSiteOrigin()}/auth/callback/${provider}?next=${encodeURIComponent(next)}`;
}
