"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";

export const signOut = async () => {
	const supabase = await createClient();
	await supabase.auth.signOut();
	redirect("/login");
};
