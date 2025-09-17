"use server";

import { redirect } from "next/navigation";
import { type AuthError, createAuthError, createClient } from "@/lib/supabase";
import { initializeAccount } from "@/services/accounts";

export const verifyEmail = async (
	_prevState: null | AuthError,
	formData: FormData,
): Promise<AuthError | null> => {
	const verificationEmailEntry = formData.get("verificationEmail");
	const tokenEntry = formData.get("token");
	if (
		typeof verificationEmailEntry !== "string" ||
		typeof tokenEntry !== "string"
	) {
		return createAuthError({
			code: "invalid_verification_payload",
			message: "Invalid verification payload. Please request a new code.",
			name: "AuthValidationError",
			status: 400,
		});
	}
	const verificationEmail = verificationEmailEntry;
	const token = tokenEntry;
	const supabase = await createClient();
	const { data: supabaseData, error } = await supabase.auth.verifyOtp({
		email: verificationEmail,
		token,
		type: "email",
	});
	if (error != null) {
		return createAuthError(error);
	}
	if (supabaseData.user == null) {
		return createAuthError({
			code: "missing_user",
			message: "No user returned",
			name: "AuthMissingUserError",
			status: 500,
		});
	}

	const _user = await initializeAccount(
		supabaseData.user.id,
		supabaseData.user.email,
	);

	redirect("/");
};

export const resendOtp = async (
	_prevState: null | AuthError,
	formData: FormData,
): Promise<AuthError | null> => {
	const verificationEmailEntry = formData.get("verificationEmail");
	if (typeof verificationEmailEntry !== "string") {
		return createAuthError({
			code: "invalid_email",
			message: "Please enter a valid email address.",
			name: "AuthValidationError",
			status: 422,
		});
	}
	const verificationEmail = verificationEmailEntry;
	const supabase = await createClient();
	const { error } = await supabase.auth.resend({
		type: "signup",
		email: verificationEmail,
	});
	if (error != null) {
		return createAuthError(error);
	}
	return {
		code: "success",
		status: 200,
		message: "A new confirmation code has been sent to your email address.",
		name: "Success",
	};
};
