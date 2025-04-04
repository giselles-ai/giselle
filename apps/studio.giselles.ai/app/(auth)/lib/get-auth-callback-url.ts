// https://supabase.com/docs/guides/auth/redirect-urls
import type { OAuthProvider } from "@/services/accounts";

export function getAuthCallbackUrl({
	next = "/",
	provider,
	addSuccessRedirect = true,
}: {
	next?: string;
	provider: OAuthProvider;
	addSuccessRedirect?: boolean;
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

	const callbackUrl = `${url}auth/callback/${provider}`;

	// Set the redirect destination after successful authentication
	// Configure to transition to the completion screen
	if (addSuccessRedirect) {
		// Use relative path for the success URL to avoid URL duplication
		const successUrl =
			"/auth/github/complete?status=success&message=GitHub connection completed successfully";
		return `${callbackUrl}?next=${encodeURIComponent(successUrl)}`;
	}

	return `${callbackUrl}?next=${encodeURIComponent(next)}`;
}
