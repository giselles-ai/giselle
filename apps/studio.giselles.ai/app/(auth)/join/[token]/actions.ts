"use server";

import { captureException } from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { revokeInvitation } from "@/app/(main)/settings/team/invitation";
import { createClient } from "@/lib/supabase/server";
import { JoinError } from "./errors";
import { acceptInvitation } from "./invitation";

export async function signoutUser(formData: FormData) {
	const token = formData.get("token") as string;
	const supabase = await createClient();
	await supabase.auth.signOut();
	redirect(`/join/${encodeURIComponent(token)}/login`);
}

export async function joinTeam(formData: FormData) {
	const rawToken = formData.get("token");
	const token = typeof rawToken === "string" ? rawToken : "";
	try {
		await acceptInvitation(token);
	} catch (err: unknown) {
		if (err instanceof JoinError) {
			redirect(`/join/${encodeURIComponent(token)}`);
		}
		captureException(err);
		redirect(`/join/${encodeURIComponent(token)}`);
	}
	redirect("/join/success");
}

export async function declineInvitation(formData: FormData) {
	const rawToken = formData.get("token");
	const token = typeof rawToken === "string" ? rawToken : "";
	await revokeInvitation(token);
	const serviceUrl = process.env.NEXT_PUBLIC_SERVICE_SITE_URL;
	if (!serviceUrl) {
		throw new Error("NEXT_PUBLIC_SERVICE_SITE_URL is not set");
	}
	redirect(serviceUrl);
}
