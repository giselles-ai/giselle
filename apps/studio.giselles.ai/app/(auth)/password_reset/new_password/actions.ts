"use server";

import { redirect } from "next/navigation";
import { type AuthError, createAuthError, createClient } from "@/lib/supabase";

export const resetPassword = async (
	_prevState: AuthError | null,
	formData: FormData,
): Promise<AuthError | null> => {
	const newPassword = formData.get("new_password");
	if (
		newPassword == null ||
		typeof newPassword !== "string" ||
		newPassword.trim() === ""
	) {
		return createAuthError({
			name: "PasswordResetError",
			message: "Please enter a valid password",
			status: 422,
			code: "validation_failed",
		});
	}
	const supabase = await createClient();
	const { error } = await supabase.auth.updateUser({ password: newPassword });
	if (error) {
		console.error("Password reset error:", error);
		return createAuthError(error);
	}
	redirect("/password_reset/complete");
	return null;
};
