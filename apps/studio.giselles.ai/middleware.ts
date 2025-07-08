import { get } from "@vercel/edge-config";
import { type MiddlewareConfig, NextResponse } from "next/server";
import { supabaseMiddleware } from "./lib/supabase";

export default supabaseMiddleware(async (user, request) => {
	const maintenance = await get("maintenance");
	if (maintenance) {
		request.nextUrl.pathname = "/maintenance";

		// Rewrite to the url
		return NextResponse.rewrite(request.nextUrl);
	}
	if (user == null) {
		// no user, potentially respond by redirecting the user to the login page
		const url = request.nextUrl.clone();
		const returnUrl = request.nextUrl.pathname + request.nextUrl.search;
		url.pathname = "/login";
		url.searchParams.set("returnUrl", returnUrl);
		return NextResponse.redirect(url);
	}
});

export const config: MiddlewareConfig = {
	matcher: [
		"/apps/:path*",
		"/settings/:path*",
		"/workspaces/:path*",
		"/((?!api/giselle/experimental_github-webhook)api/giselle/:path*)",
		"/connected",
		"/github/:path*",
		"/subscriptions/:path*",
		"/stage/:path*",
	],
};
