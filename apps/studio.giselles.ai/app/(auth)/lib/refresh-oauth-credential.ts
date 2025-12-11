import { and, eq } from "drizzle-orm";
import { db, oauthCredentials, supabaseUserMappings } from "@/db";
import { getUser } from "@/lib/supabase";
import { encryptToken } from "@/lib/token-encryption";

export async function refreshOauthCredential(
	provider: string,
	accessToken: string,
	refreshToken: string,
	expiresAt: Date,
	scope: string,
	tokenType: string,
) {
	const supabaseUser = await getUser();
	const [res] = await db
		.select({ userDbId: supabaseUserMappings.userDbId })
		.from(supabaseUserMappings)
		.where(eq(supabaseUserMappings.supabaseUserId, supabaseUser.id));

	await db
		.update(oauthCredentials)
		.set({
			accessToken: encryptToken(accessToken),
			expiresAt,
			refreshToken: encryptToken(refreshToken),
			updatedAt: new Date(),
			scope,
			tokenType,
		})
		.where(
			and(
				eq(oauthCredentials.userId, res.userDbId),
				eq(oauthCredentials.provider, provider),
			),
		);
}
