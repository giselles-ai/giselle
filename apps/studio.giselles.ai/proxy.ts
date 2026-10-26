import { NextResponse } from "next/server";
import { supabaseMiddleware } from "./lib/supabase";

export const proxy = supabaseMiddleware((user, request) => {
	if (process.env.MAINTENANCE_MODE === "true") {
		request.nextUrl.pathname = "/maintenance";

		// Rewrite to the url
		return Promise.resolve(NextResponse.rewrite(request.nextUrl));
	}
	if (user == null) {
		// no user, potentially respond by redirecting the user to the login page
		const url = request.nextUrl.clone();
		const returnUrl = request.nextUrl.pathname + request.nextUrl.search;
		url.pathname = "/login";
		url.searchParams.set("returnUrl", returnUrl);
		return Promise.resolve(NextResponse.redirect(url));
	}
	return Promise.resolve(undefined);
});

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|.well-known|webhooks|legal|login|signup|join|pricing|password_reset|auth|api/vector-stores/cron|api/apps|agent-api|robots\\.txt|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
