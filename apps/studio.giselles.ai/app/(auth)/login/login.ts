"use server";

import { redirect } from "next/navigation";
import { isValidReturnUrl } from "@/app/(auth)/lib";
import { type AuthError, createAuthError, createClient } from "@/lib/supabase";

export async function login(
	_prevState: AuthError | null,
	formData: FormData,
): Promise<AuthError | null> {
	const supabase = await createClient();

	const emailEntry = formData.get("email");
	const passwordEntry = formData.get("password");
	if (typeof emailEntry !== "string" || typeof passwordEntry !== "string") {
		return createAuthError({
			code: "invalid_credentials_payload",
			message: "Please enter both email and password.",
			name: "AuthValidationError",
			status: 400,
		});
	}
	const credentials = {
		email: emailEntry,
		password: passwordEntry,
	};
	const returnUrlEntry = formData.get("returnUrl");
	const { error } = await supabase.auth.signInWithPassword(credentials);

	if (error) {
		return createAuthError(error);
	}

	// Validate returnUrl to prevent open redirect attacks
	const validReturnUrl = isValidReturnUrl(returnUrlEntry)
		? returnUrlEntry
		: "/apps";
	redirect(validReturnUrl);
	return null;
}
