import { createClient } from "@supabase/supabase-js";

const storageBucketName = "public-assets";

export function appStorage() {
	const supabaseClient = createClient(
		// biome-ignore lint/style/noNonNullAssertion: SUPABASE_URL is always set and errors occur elsewhere too, so excessive error handling is unnecessary
		process.env.SUPABASE_URL!,
		// biome-ignore lint/style/noNonNullAssertion: SUPABASE_SERVICE_KEY is always set and errors occur elsewhere too, so excessive error handling is unnecessary
		process.env.SUPABASE_SERVICE_KEY!,
		{},
	);
	return supabaseClient.storage.from(storageBucketName);
}
