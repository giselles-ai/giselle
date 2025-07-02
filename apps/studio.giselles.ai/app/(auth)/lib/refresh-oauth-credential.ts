import { and, eq } from "drizzle-orm";
import { db, oauthCredentials, supabaseUserMappings } from "@/drizzle";
import { getUser } from "@/lib/supabase";

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
			accessToken,
			expiresAt,
			refreshToken,
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
