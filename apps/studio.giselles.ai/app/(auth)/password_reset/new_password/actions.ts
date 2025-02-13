"use server";

import { createClient } from "@/lib/supabase";
import { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export const resetPassword = async (
	_prevState: AuthError | null,
	formData: FormData,
): Promise<AuthError | null> => {
	const newPassword = formData.get("new_password");
	if (newPassword == null || typeof newPassword !== "string") {
		return new AuthError("invalid_new_password");
	}
	const supabase = await createClient();
	const { error } = await supabase.auth.updateUser({ password: newPassword });
	if (error != null) {
		return error;
	}
	redirect("/password_reset/complete");
	return null;
};
