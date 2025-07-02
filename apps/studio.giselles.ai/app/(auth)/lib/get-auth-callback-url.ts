// https://supabase.com/docs/guides/auth/redirect-urls
import type { OAuthProvider } from "@/services/accounts";

export function getAuthCallbackUrl({
	next = "/",
	provider,
}: {
	next?: string;
	provider: OAuthProvider;
}): string {
	if (!provider) {
		throw new Error("Provider is required");
	}
	let url =
		process.env.NEXT_PUBLIC_SITE_URL ??
		process.env.NEXT_PUBLIC_VERCEL_URL ??
		"http://localhost:3000/";
	url = url.startsWith("http") ? url : `https://${url}`;
	url = url.endsWith("/") ? url : `${url}/`;
	return `${url}auth/callback/${provider}?next=${encodeURIComponent(next)}`;
}
