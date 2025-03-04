import { NextResponse } from "next/server";
import { supabaseMiddleware } from "./lib/supabase";

export default supabaseMiddleware(async (user, request) => {
	if (user == null) {
		// no user, potentially respond by redirecting the user to the login page
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}
	return;
});

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|.well-known|dev|webhooks|legal|login|signup|pricing|password_reset|subscription|auth|api/cron|api/giselle|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
