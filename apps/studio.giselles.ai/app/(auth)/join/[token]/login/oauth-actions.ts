"use server";

import { redirect } from "next/navigation";
import { getAuthCallbackUrl } from "@/app/(auth)/lib";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase";
import type { OAuthProvider } from "@/services/accounts";
import { encodeInviteState } from "./oauth-state";

function assertStringField(
	formData: FormData,
	fieldName: string,
): string | null {
	const entry = formData.get(fieldName);
	if (typeof entry !== "string" || entry.trim() === "") {
		return null;
	}
	return entry;
}

async function authorizeJoinOAuth(provider: OAuthProvider, formData: FormData) {
	const token = assertStringField(formData, "token");
	const invitedEmail = assertStringField(formData, "invitedEmail");
	if (token == null || invitedEmail == null) {
		throw new Error("Invalid invitation parameters.");
	}

	const invitationState = encodeInviteState({
		invitationToken: token,
		invitedEmail,
	});
	const callbackPath = `/join/${encodeURIComponent(token)}/oauth/callback?inviteState=${encodeURIComponent(invitationState)}`;
	const supabase = await createClient();

	const queryParams: Record<string, string> = {};
	if (provider === "google") {
		queryParams.login_hint = invitedEmail;
	}

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider,
		options: {
			redirectTo: getAuthCallbackUrl({ provider, next: callbackPath }),
			queryParams,
		},
	});
	logger.debug({ provider, invitationToken: token }, "Authorized invite OAuth");

	if (error != null) {
		const { code, message, name, status } = error;
		throw new Error(`${name} occurred: ${code} (${status}): ${message}`);
	}

	if (data.url) {
		redirect(data.url);
	}
}

export async function authorizeJoinGoogle(formData: FormData) {
	await authorizeJoinOAuth("google", formData);
}

export async function authorizeJoinGitHub(formData: FormData) {
	await authorizeJoinOAuth("github", formData);
}
