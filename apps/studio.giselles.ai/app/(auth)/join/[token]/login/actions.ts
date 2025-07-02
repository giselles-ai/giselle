"use server";

import { captureException } from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { JoinError } from "../errors";
import { acceptInvitation } from "../invitation";

export async function loginUser(formData: FormData) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const token = formData.get("token") as string;
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
