import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
	const supabaseUrl = process.env.SUPABASE_URL;
	const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
	if (!supabaseUrl || !supabaseServiceKey) {
		throw new Error(
			"Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.",
		);
	}
	return createClient(supabaseUrl, supabaseServiceKey);
}
