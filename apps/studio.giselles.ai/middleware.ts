import { get } from "@vercel/edge-config";
import { NextResponse } from "next/server";
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

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|.well-known|dev|webhooks|legal|login|signup|join|pricing|password_reset|subscription|auth|api/giselle|api/vector-stores|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
