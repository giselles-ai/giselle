import { and, eq } from "drizzle-orm";
import { db, oauthCredentials, supabaseUserMappings } from "@/drizzle";
import { getUser } from "@/lib/supabase";

export async function deleteOauthCredential(provider: string) {
	const supabaseUser = await getUser();
	const [res] = await db
		.select({ userDbId: supabaseUserMappings.userDbId })
		.from(supabaseUserMappings)
		.where(eq(supabaseUserMappings.supabaseUserId, supabaseUser.id));

	await db
		.delete(oauthCredentials)
		.where(
			and(
				eq(oauthCredentials.userId, res.userDbId),
				eq(oauthCredentials.provider, provider),
			),
		);
}
