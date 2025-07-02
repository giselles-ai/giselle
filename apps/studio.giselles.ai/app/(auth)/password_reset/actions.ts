"use server";

import { AuthError } from "@supabase/auth-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";

export const sendPasswordResetEmail = async (
	prevState: AuthError | null,
	formData: FormData,
): Promise<AuthError | null> => {
	const email = formData.get("email");
	if (email == null || typeof email !== "string") {
		return new AuthError("invalid_email");
	}
	const supabase = await createClient();
	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: "/password_reset/new_password",
	});
	if (error) {
		return error;
	}
	redirect("/password_reset/sent");
	return null;
};
