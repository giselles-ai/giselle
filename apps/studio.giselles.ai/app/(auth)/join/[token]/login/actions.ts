"use server";

import { captureException } from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { JoinError } from "../errors";
import { acceptInvitation } from "../invitation";

export async function loginUser(formData: FormData) {
	const emailEntry = formData.get("email");
	const passwordEntry = formData.get("password");
	const tokenEntry = formData.get("token");
	if (
		typeof emailEntry !== "string" ||
		typeof passwordEntry !== "string" ||
		typeof tokenEntry !== "string"
	) {
		return { error: "Invalid login payload. Please try again." };
	}
	const email = emailEntry;
	const password = passwordEntry;
	const token = tokenEntry;
	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithPassword({ email, password });
	if (error) {
		return { error: error.message };
	}

	// After successful login, automatically join the team
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
