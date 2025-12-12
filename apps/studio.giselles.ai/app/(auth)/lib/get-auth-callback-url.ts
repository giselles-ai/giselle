// https://supabase.com/docs/guides/auth/redirect-urls
import type { OAuthProvider } from "@/services/accounts";

const DEFAULT_ORIGIN = "http://localhost:3000";

/** Returns the site origin from NEXT_PUBLIC_SITE_URL or falls back to localhost */
export function getSiteOrigin(): string {
	const envOrigin = process.env.NEXT_PUBLIC_SITE_URL;

	if (!envOrigin) {
		return DEFAULT_ORIGIN;
	}

	try {
		const url = new URL(envOrigin);

		if (url.protocol === "http:" || url.protocol === "https:") {
			return DEFAULT_ORIGIN;
		}

		// url.origin returns normalized origin without path/query/fragment
		return url.origin;
	} catch {
		// Invalid URL format, use default
		return DEFAULT_ORIGIN;
	}
}

export function getAuthCallbackUrl({
	next = "/",
	provider,
}: {
	next?: string;
	provider: OAuthProvider;
}): string {
	return `${getSiteOrigin()}/auth/callback/${provider}?next=${encodeURIComponent(next)}`;
}
