import { retrieveActiveStripeSubscriptionBySupabaseUserId } from "@/services/accounts/actions";
import { NextResponse } from "next/server";
import { supabaseMiddleware } from "./lib/supabase";
import { isEmailFromRoute06 } from "./lib/utils";

export default supabaseMiddleware(async (user, request) => {
	if (user == null) {
		// no user, potentially respond by redirecting the user to the login page
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	// Proceeding to check the user's subscription status since the email is not from the route06.co.jp
	if (!isEmailFromRoute06(user.email ?? "")) {
		const subscription = await retrieveActiveStripeSubscriptionBySupabaseUserId(
			user.id,
		);
		if (subscription == null) {
			const url = request.nextUrl.clone();
			url.pathname = "/subscriptions/checkout";
			return NextResponse.redirect(url);
		}
		/** @todo Validate subscription status */
	}
});

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|.well-known|dev|webhooks|legal|login|signup|pricing|password_reset|subscription|auth|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
