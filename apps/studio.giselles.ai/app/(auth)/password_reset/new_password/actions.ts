"use server";

import type { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface SerializableError {
	name: AuthError["name"];
	message: AuthError["message"];
	status?: AuthError["status"];
	code?: AuthError["code"];
}

const serializeError = (error: AuthError): SerializableError => {
	const serialized: SerializableError = {
		name: error.name,
		message: error.message,
	};
	if (error.status) {
		serialized.status = error.status;
	}
	if (error.code) {
		serialized.code = error.code;
	}
	return serialized;
};

export const resetPassword = async (
	_prevState: SerializableError | null,
	formData: FormData,
): Promise<SerializableError | null> => {
	const newPassword = formData.get("new_password");
	if (
		newPassword == null ||
		typeof newPassword !== "string" ||
		newPassword.trim() === ""
	) {
		return {
			name: "PasswordResetError",
			message: "Please enter a valid password",
			status: 422,
			code: "validation_failed",
		};
	}
	const supabase = await createClient();
	const { error } = await supabase.auth.updateUser({ password: newPassword });
	if (error) {
		console.error("Password reset error:", error);
		return serializeError(error);
	}
	redirect("/password_reset/complete");
	return null;
};
