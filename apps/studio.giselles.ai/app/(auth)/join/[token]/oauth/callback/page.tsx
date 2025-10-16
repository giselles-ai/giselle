import { captureException } from "@sentry/nextjs";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getUser } from "@/lib/supabase/get-user";
import { JoinError } from "../../errors";
import { acceptInvitation } from "../../invitation";
import { decodeInviteState } from "../../login/oauth-state";

const mismatchErrorMessage =
	"Please continue with the social account that matches the invitation email address.";
const missingStateMessage =
	"We could not verify your login session. Please try again.";
const invalidStateMessage =
	"We could not validate your login session details. Please try again.";
const sessionErrorMessage =
	"We could not confirm your login information. Please sign in again.";

function buildLoginRedirectUrl(token: string, message: string): string {
	const searchParams = new URLSearchParams({
		authError: message,
	});
	return `/join/${encodeURIComponent(token)}/login?${searchParams.toString()}`;
}

async function signOutUser() {
	try {
		const supabase = await createClient();
		await supabase.auth.signOut();
	} catch (error) {
		captureException(error);
	}
}

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ token: string }>;
	searchParams: Promise<{ authError?: string; inviteState?: string }>;
}) {
	const [{ token }, { authError, inviteState }] = await Promise.all([
		params,
		searchParams,
	]);

	if (typeof authError === "string" && authError.trim() !== "") {
		redirect(buildLoginRedirectUrl(token, authError));
	}

	if (typeof inviteState !== "string" || inviteState.trim() === "") {
		redirect(buildLoginRedirectUrl(token, missingStateMessage));
	}

	const decodedState = (() => {
		try {
			return decodeInviteState(inviteState);
		} catch (error) {
			captureException(error);
			redirect(buildLoginRedirectUrl(token, invalidStateMessage));
		}
	})();

	if (decodedState.invitationToken !== token) {
		redirect(buildLoginRedirectUrl(token, invalidStateMessage));
	}

	const user: User = await (async () => {
		try {
			return await getUser();
		} catch (error) {
			captureException(error);
			redirect(buildLoginRedirectUrl(token, sessionErrorMessage));
		}
	})();

	if (user.email !== decodedState.invitedEmail) {
		await signOutUser();
		redirect(buildLoginRedirectUrl(token, mismatchErrorMessage));
	}

	try {
		await acceptInvitation(token);
	} catch (error) {
		if (error instanceof JoinError) {
			if (error.code === "wrong_email") {
				await signOutUser();
			}
			redirect(`/join/${encodeURIComponent(token)}`);
		}
		captureException(error);
		redirect(buildLoginRedirectUrl(token, invalidStateMessage));
	}

	redirect("/join/success");
}
