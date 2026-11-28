import { type NextRequest, NextResponse } from "next/server";
import { isLocalStudio } from "./lib/local-studio";
import { supabaseMiddleware } from "./lib/supabase";

const authenticatedProxy = supabaseMiddleware((user, request) => {
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

export function proxy(request: NextRequest) {
	if (isLocalStudio) return NextResponse.next();
	return authenticatedProxy(request);
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|.well-known|webhooks|legal|login|signup|join|pricing|password_reset|auth|api/vector-stores/cron|api/apps|agent-api|robots\\.txt|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
