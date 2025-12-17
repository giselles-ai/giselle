// The client you created from the Server-Side Auth instructions

import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { isValidReturnUrl } from "../../lib";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const token_hash = searchParams.get("token_hash");
	const type = searchParams.get("type") as EmailOtpType | null;
	const nextParam = searchParams.get("next");
	const next = isValidReturnUrl(nextParam) ? nextParam : "/";
	const redirectTo = request.nextUrl.clone();
	redirectTo.pathname = next;

	if (token_hash && type) {
		const supabase = await createClient();

		const { data, error } = await supabase.auth.verifyOtp({
			type,
			token_hash,
		});
		if (data.session === null || error !== null) {
			redirectTo.pathname = "/password_reset";
			return NextResponse.redirect(redirectTo);
		}
		await supabase.auth.setSession(data.session);
		return NextResponse.redirect(redirectTo);
	}
}
