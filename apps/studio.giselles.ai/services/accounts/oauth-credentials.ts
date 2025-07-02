import { and, eq } from "drizzle-orm";
import { db, oauthCredentials, supabaseUserMappings, users } from "@/drizzle";
import { getUser } from "@/lib/supabase";

export type OAuthProvider = "github" | "google";

export async function getOauthCredential(provider: OAuthProvider) {
	const supabaseUser = await getUser();
	const [result] = await db
		.select({ oauthCredentials: oauthCredentials })
		.from(supabaseUserMappings)
		.innerJoin(users, eq(users.dbId, supabaseUserMappings.userDbId))
		.innerJoin(oauthCredentials, eq(users.dbId, oauthCredentials.userId))
		.where(
			and(
				eq(supabaseUserMappings.supabaseUserId, supabaseUser.id),
				eq(oauthCredentials.provider, provider),
			),
		);
	return result?.oauthCredentials;
}
