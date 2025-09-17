"use server";

import { redirect } from "next/navigation";

import { type AuthError, createAuthError, createClient } from "@/lib/supabase";

export async function signup(
	email: string,
	password: string,
): Promise<AuthError | null> {
	const supabase = await createClient();

	const { error } = await supabase.auth.signUp({ email, password });

	if (error != null) {
		return createAuthError(error);
	}

	redirect("/signup/verify-email");
	return null;
}
