import type { User } from "@supabase/auth-js";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "../logger";
import { createServerClient } from "./create-server-client";

export const supabaseMiddleware = (
	guardCallback?: (
		user: User | null,
		request: NextRequest,
	) => Promise<NextResponse | undefined>,
) => {
	return async (request: NextRequest) => {
		const requestId = request.headers.get("x-vercel-id");
		logger.debug({ requestId }, "supabaseMiddleware");
		// Dev safeguard: If Supabase env vars are not set locally, skip auth wiring
		if (
			!process.env.NEXT_PUBLIC_SUPABASE_URL ||
			!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
		) {
			// Throw error in production if Supabase environment variables are missing
			if (process.env.NODE_ENV === "production") {
				throw new Error(
					"Supabase environment variables are required in production",
				);
			}
			return NextResponse.next({ request });
		}

		let supabaseResponse = NextResponse.next({
			request,
		});
		logger.debug({ requestId }, "next finished");
		const supabase = createServerClient({
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value);
					}
					supabaseResponse = NextResponse.next({
						request,
					});
					for (const { name, value, options } of cookiesToSet) {
						supabaseResponse.cookies.set(name, value, options);
					}
				},
			},
		});

		// IMPORTANT: Avoid writing any logic between createServerClient and
		// supabase.auth.getUser(). A simple mistake could make it very hard to debug
		// issues with users being randomly logged out.

		const {
			data: { user },
		} = await supabase.auth.getUser();
		const response = guardCallback?.(user, request);
		logger.debug({ requestId, response }, "check");
		if (response != null) {
			return response;
		}

		// IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
		// creating a new response object with NextResponse.next() make sure to:
		// 1. Pass the request in it, like so:
		//    const myNewResponse = NextResponse.next({ request })
		// 2. Copy over the cookies, like so:
		//    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
		// 3. Change the myNewResponse object to fit your needs, but avoid changing
		//    the cookies!
		// 4. Finally:
		//    return myNewResponse
		// If this is not done, you may be causing the browser and server to go out
		// of sync and terminate the user's session prematurely!

		return supabaseResponse;
	};
};
