import { and, eq, sql } from "drizzle-orm/sql";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db, oauthCredentials, supabaseUserMappings } from "@/drizzle";
import { getUser } from "@/lib/supabase";

export async function getSession() {
	const supabaseUser = await getUser();

	const supabaseUserMap = await db
		.select()
		.from(supabaseUserMappings)
		.where(eq(supabaseUserMappings.supabaseUserId, supabaseUser.id))
		.limit(1);

	const userId = supabaseUserMap[0].userDbId;

	const queries = await db
		.select({
			accessToken: oauthCredentials.accessToken,
			refreshToken: oauthCredentials.refreshToken,
			expiresAt: oauthCredentials.expiresAt,
			providerAccountId: oauthCredentials.providerAccountId,
		})
		.from(oauthCredentials)
		.where(eq(oauthCredentials.userId, userId));

	let accessToken = null;

	if (queries.length !== 0) {
		const oauthCredential = queries[0];

		const isAccessTokenValid =
			oauthCredential.expiresAt &&
			Date.now() < oauthCredential.expiresAt.getTime();

		if (isAccessTokenValid) {
			accessToken = oauthCredential.accessToken;
		} else {
			const refreshedToken = await refreshAccessToken({
				userId,
				refreshToken: oauthCredential.refreshToken,
				providerAccountId: oauthCredential.providerAccountId,
			});

			accessToken = refreshedToken.accessToken;
		}
	}

	return {
		userId,
		accessToken,
	};
}

export const { handlers, signIn, signOut } = NextAuth({
	providers: [
		Google({
			authorization: {
				params: {
					scope:
						"openid email profile https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly",
					prompt: "consent",
					access_type: "offline",
					response_type: "code",
				},
			},
		}),
	],
	callbacks: {
		async jwt({ token, user, account }) {
			try {
				if (account && user) {
					const expiresIn = account.expires_in || 3600; // default to 1 hour
					const expiresAt = Date.now() + expiresIn * 1000; // convert to unix timestamp in milliseconds

					token = {
						...token,
						accessToken: account.access_token,
						refreshToken: account.refresh_token,
						accessTokenExpires: expiresAt,
						tokenType: account.token_type,
						scope: account.scope,
						providerAccountId: account.providerAccountId,
					};

					const supabaseUser = await getUser();

					const existingSupabaseUserMapping = await db
						.select()
						.from(supabaseUserMappings)
						.where(eq(supabaseUserMappings.supabaseUserId, supabaseUser.id))
						.limit(1);

					if (existingSupabaseUserMapping.length === 0) {
						throw new Error(
							`SupabaseUserMapping with Supabase ID ${supabaseUser.id} does not exist in supabaseUserMappings table`,
						);
					}

					const userId = existingSupabaseUserMapping[0].userDbId;

					if (!account.access_token) {
						const message = "Access token is missing";
						console.error(message);
						throw new Error(message);
					}

					token.userId = userId;

					const now = new Date();

					const values: typeof oauthCredentials.$inferInsert = {
						userId,
						provider: "google",
						providerAccountId: account.providerAccountId,
						accessToken: account.access_token,
						refreshToken: account.refresh_token,
						expiresAt: new Date(expiresAt),
						tokenType: account.token_type,
						scope: account.scope,
						createdAt: now,
						updatedAt: now,
					};

					await db
						.insert(oauthCredentials)
						.values(values)
						.onConflictDoUpdate({
							target: [
								oauthCredentials.userId,
								oauthCredentials.provider,
								oauthCredentials.providerAccountId,
							],
							set: {
								accessToken: sql`excluded.access_token`,
								refreshToken: sql`excluded.refresh_token`,
								expiresAt: sql`excluded.expires_at`,
								tokenType: sql`excluded.token_type`,
								scope: sql`excluded.scope`,
								updatedAt: sql`excluded.updated_at`,
							},
						})
						.execute();
				}

				const isAccessTokenValid = Date.now() < token.accessTokenExpires;
				if (isAccessTokenValid) {
					return token;
				}

				return refreshAccessToken(token);
			} catch (error) {
				console.error("JWT callback error:", error);
				token.message = "JWTCallbackError";
				return token;
			}
		},
	},
});

// biome-ignore lint: lint/suspicious/noExplicitAny
async function refreshAccessToken(token: any) {
	try {
		const url = "https://oauth2.googleapis.com/token";

		const client_id = process.env.AUTH_GOOGLE_ID;
		if (!client_id) {
			throw new Error("AUTH_GOOGLE_ID is not set");
		}

		const client_secret = process.env.AUTH_GOOGLE_SECRET;
		if (!client_secret) {
			throw new Error("AUTH_GOOGLE_SECRET is not set");
		}

		const body = new URLSearchParams({
			client_id,
			client_secret,
			grant_type: "refresh_token",
			refresh_token: token.refreshToken,
		});

		const response = await fetch(url, {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			method: "POST",
			body: body.toString(),
		});

		const refreshedTokens = await response.json();

		if (!response.ok) {
			throw refreshedTokens;
		}

		await db
			.update(oauthCredentials)
			.set({
				accessToken: refreshedTokens.access_token,
				expiresAt: new Date(Date.now() + refreshedTokens.expires_in * 1000),
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(oauthCredentials.userId, token.userId),
					eq(oauthCredentials.provider, "google"),
					eq(oauthCredentials.providerAccountId, token.providerAccountId),
				),
			)
			.execute();

		return {
			...token,
			accessToken: refreshedTokens.access_token,
			accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
			refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
		};
	} catch (error) {
		console.error("Failed to refresh access token", error);

		return {
			...token,
			error: "RefreshAccessTokenError",
		};
	}
}
