import { and, eq } from "drizzle-orm";
import { db, oauthCredentials, supabaseUserMappings, users } from "@/db";
import { getUser } from "@/lib/supabase";
import { decryptToken } from "@/lib/token-encryption";

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

	if (!result) {
		return undefined;
	}

	const cred = result.oauthCredentials;
	return {
		...cred,
		accessToken: decryptToken(cred.accessToken),
		refreshToken: cred.refreshToken ? decryptToken(cred.refreshToken) : null,
	};
}
