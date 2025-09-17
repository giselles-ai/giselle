"use server";

import { redirect } from "next/navigation";
import { type AuthError, createAuthError, createClient } from "@/lib/supabase";

export const sendPasswordResetEmail = async (
	_prevState: AuthError | null,
	formData: FormData,
): Promise<AuthError | null> => {
	const email = formData.get("email");
	if (email == null || typeof email !== "string") {
		return createAuthError({
			code: "invalid_email",
			message: "Please enter a valid email address.",
			name: "AuthValidationError",
			status: 422,
		});
	}
	const supabase = await createClient();
	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: "/password_reset/new_password",
	});
	if (error) {
		return createAuthError(error);
	}
	redirect("/password_reset/sent");
	return null;
};
