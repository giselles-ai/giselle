"use server";

import { getUser } from "@/lib/supabase";
import { isEmailFromRoute06 } from "@/lib/utils";

export const isRoute06User = async () => {
	const supabaseUser = await getUser();
	const email = supabaseUser.email;

	if (!email) {
		throw new Error("No email found for user");
	}

	return isEmailFromRoute06(email);
};
