"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase";

export async function signup(email: string, password: string) {
	const supabase = await createClient();

	const { error } = await supabase.auth.signUp({ email, password });

	if (error != null) {
		return {
			code: error.code,
			status: error.status,
			message: error.message,
			name: error.name,
		};
	}

	redirect("/signup/verify-email");
	return null;
}
