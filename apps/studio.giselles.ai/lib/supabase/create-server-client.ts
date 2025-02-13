import {
	type CookieMethodsServer,
	createServerClient as createSupabaseServerClient,
} from "@supabase/ssr";
import invariant from "tiny-invariant";

type CreateServerClientArgs = {
	cookies: CookieMethodsServer;
};
export const createServerClient = ({ cookies }: CreateServerClientArgs) => {
	invariant(
		process.env.NEXT_PUBLIC_SUPABASE_URL != null,
		"Missing env.NEXT_PUBLIC_SUPABASE_URL",
	);
	invariant(
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY != null,
		"Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY",
	);
	const supabase = createSupabaseServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies,
		},
	);
	return supabase;
};
