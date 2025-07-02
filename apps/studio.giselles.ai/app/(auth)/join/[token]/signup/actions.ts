"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";

export async function signupJoin(formData: FormData) {
	const token = formData.get("token") as string;
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const supabase = await createClient();
	const { error, data } = await supabase.auth.signUp({ email, password });
	if (error) {
		return { error: error.message };
	}
	// redirect to the local verify email page with the invitation token
	redirect(`/join/${encodeURIComponent(token)}/signup/verify-email`);
}
