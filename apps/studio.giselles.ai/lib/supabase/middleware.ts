import type { User } from "@supabase/auth-js";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "./create-server-client";

export const supabaseMiddleware = (
	guardCallback?: (
		user: User | null,
		request: NextRequest,
	) => Promise<NextResponse | undefined>,
) => {
	return async (request: NextRequest) => {
		let supabaseResponse = NextResponse.next({
			request,
		});
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
