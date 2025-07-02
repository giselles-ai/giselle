"use server";

import { redirect } from "next/navigation";
import { type AuthError, createClient } from "@/lib/supabase";
import { initializeAccount } from "@/services/accounts";

export const verifyEmail = async (
	prevState: null | AuthError,
	formData: FormData,
): Promise<AuthError | null> => {
	const verificationEmail = formData.get("verificationEmail") as string;
	const token = formData.get("token") as string;
	const supabase = await createClient();
	const { data: supabaseData, error } = await supabase.auth.verifyOtp({
		email: verificationEmail,
		token,
		type: "email",
	});
	if (error != null) {
		return {
			code: error.code,
			message: error.message,
			status: error.status,
			name: error.name,
		};
	}
	if (supabaseData.user == null) {
		return {
			code: "unknown",
			status: 500,
			message: "No user returned",
			name: "UnknownError",
		};
	}

	const user = await initializeAccount(
		supabaseData.user.id,
		supabaseData.user.email,
	);

	redirect("/");
};

export const resendOtp = async (
	prevState: null | AuthError,
	formData: FormData,
): Promise<AuthError | null> => {
	const verificationEmail = formData.get("verificationEmail") as string;
	const supabase = await createClient();
	const { error } = await supabase.auth.resend({
		type: "signup",
		email: verificationEmail,
	});
	if (error != null) {
		return {
			code: error.code,
			message: error.message,
			status: error.status,
			name: error.name,
		};
	}
	return {
		code: "success",
		status: 200,
		message: "A new confirmation code has been sent to your email address.",
		name: "Success",
	};
};
