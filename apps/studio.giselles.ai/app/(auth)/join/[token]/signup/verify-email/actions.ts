"use server";

import { captureException } from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { createAuthError, createClient } from "@/lib/supabase";
import { initializeAccount } from "@/services/accounts";
import { JoinError } from "../../errors";
import { acceptInvitation } from "../../invitation";

export async function verifyJoinEmail(formData: FormData) {
	const invitedEmailEntry = formData.get("invitedEmail");
	const otpTokenEntry = formData.get("token");
	const invitationTokenEntry = formData.get("invitationToken");
	if (
		typeof invitedEmailEntry !== "string" ||
		typeof otpTokenEntry !== "string" ||
		typeof invitationTokenEntry !== "string"
	) {
		return {
			error: "Invalid verification payload. Please try again.",
		};
	}
	const invitedEmail = invitedEmailEntry;
	const otpToken = otpTokenEntry;
	const invitationToken = invitationTokenEntry;
	const supabase = await createClient();
	const { data, error } = await supabase.auth.verifyOtp({
		email: invitedEmail,
		token: otpToken,
		type: "email",
	});
	if (error) {
		return { error: createAuthError(error).message };
	}
	if (!data.user) {
		return { error: "No user returned" };
	}
	await initializeAccount(data.user.id, data.user.email);

	// After successful email verification, automatically join the team
	try {
		await acceptInvitation(invitationToken);
	} catch (err: unknown) {
		if (err instanceof JoinError) {
			redirect(`/join/${encodeURIComponent(invitationToken)}`);
		}
		captureException(err);
		redirect(`/join/${encodeURIComponent(invitationToken)}`);
	}
	redirect("/join/success");
}

export async function resendJoinOtp(formData: FormData) {
	const invitedEmailEntry = formData.get("invitedEmail");
	if (typeof invitedEmailEntry !== "string") {
		return {
			code: "invalid_email",
			message: "Invalid email address.",
			status: 400,
			name: "AuthValidationError",
		};
	}
	const invitedEmail = invitedEmailEntry;
	const supabase = await createClient();
	const { error } = await supabase.auth.resend({
		type: "signup",
		email: invitedEmail,
	});
	if (error) {
		const mappedError = createAuthError(error);
		return {
			code: mappedError.code,
			message: mappedError.message,
			status: mappedError.status,
			name: mappedError.name,
		};
	}
	return {
		code: "success",
		status: 200,
		message: "A new confirmation code has been sent to your email address.",
		name: "Success",
	};
}
