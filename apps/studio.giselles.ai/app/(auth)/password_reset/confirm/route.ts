// The client you created from the Server-Side Auth instructions

import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const token_hash = searchParams.get("token_hash");
	const type = searchParams.get("type") as EmailOtpType | null;
	const next = searchParams.get("next") ?? "/";
	const redirectTo = request.nextUrl.clone();
	redirectTo.pathname = next;

	if (token_hash && type) {
		const supabase = await createClient();

		const { data, error } = await supabase.auth.verifyOtp({
			type,
			token_hash,
		});
		if (data.session == null) {
			throw new Error("No session returned");
		}
		await supabase.auth.setSession(data.session);
		if (!error) {
			return NextResponse.redirect(redirectTo);
		}
	}

	// return the user to an error page with some instructions
	redirectTo.pathname = "/auth/auth-code-error";
	return NextResponse.redirect(redirectTo);
}
