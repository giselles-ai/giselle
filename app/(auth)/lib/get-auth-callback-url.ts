// https://supabase.com/docs/guides/auth/redirect-urls
export function getAuthCallbackUrl({ next = "/" } = {}): string {
	let url =
		process.env.NEXT_PUBLIC_SITE_URL ??
		process.env.NEXT_PUBLIC_VERCEL_URL ??
		"http://localhost:3000/";
	url = url.startsWith("http") ? url : `https://${url}`;
	url = url.endsWith("/") ? url : `${url}/`;
	return `${url}auth/callback?next=${encodeURIComponent(next)}`;
}
