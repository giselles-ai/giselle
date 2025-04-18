// The client you created from the Server-Side Auth instructions
import { db, oauthCredentials, supabaseUserMappings, users } from "@/drizzle";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase";
import { type OAuthProvider, initializeAccount } from "@/services/accounts";
import type { Session, User } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ provider: OAuthProvider }> },
) {
	const { searchParams, origin } = new URL(request.url);
	const { provider } = await params;

	logger.debug(
		{
			searchParams,
			origin,
			url: request.url,
		},
		"'searchParams' and 'origin' got from request",
	);

	// Get the redirect URL - always respect the next parameter
	const next = searchParams.get("next") ?? "/";

	// Check for authentication errors using existing function
	const errorMessage = checkError(searchParams);
	if (errorMessage) {
		// Instead of returning an error response, redirect with the error message
		return handleRedirect(
			request,
			next,
			`authError=${encodeURIComponent(errorMessage)}`,
		);
	}

	const code = searchParams.get("code");
	logger.debug({ code }, "code got from query param");
	if (!code) {
		return new Response("No code provided", { status: 400 });
	}

	const supabase = await createClient();
	const { data, error } = await supabase.auth.exchangeCodeForSession(code);
	if (error) {
		const { code, message, name, status } = error;
		// Redirect with error instead of showing error page
		return handleRedirect(
			request,
			next,
			`authError=${encodeURIComponent(`${name} occurred: ${code} (${status}): ${message}`)}`,
		);
	}

	logger.debug(
		{
			provider: data.session.user.app_metadata.provider,
			providers: data.session.user.app_metadata.providers,
		},
		"session data got from Supabase",
	);

	try {
		const { user, session } = data;
		await initializeUserIfNeeded(user);
		await storeProviderTokens(user, session, provider);
	} catch (error) {
		const errorMsg =
			error instanceof Error ? error.message : "Unknown error occurred";
		// Redirect with error instead of showing error page
		return handleRedirect(
			request,
			next,
			`authError=${encodeURIComponent(errorMsg)}`,
		);
	}

	// Success case - redirect to the next page without error
	return handleRedirect(request, next);
}

function checkError(searchParams: URLSearchParams) {
	const error = searchParams.get("error");
	if (error) {
		// if error is in param, return an error response
		const errorDescription = searchParams.get("error_description");
		const errorCode = searchParams.get("error_code");
		return `Error occurred: ${errorCode} - ${errorDescription}`;
	}
	return "";
}

function handleRedirect(
	request: NextRequest,
	path: string,
	queryString?: string,
) {
	const { origin } = new URL(request.url);
	const redirectPath = queryString ? `${path}?${queryString}` : path;

	// Check for forwarded host (load balancer case)
	const forwardedHost = request.headers.get("x-forwarded-host");
	if (forwardedHost) {
		const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
		return NextResponse.redirect(
			`${forwardedProto}://${forwardedHost}${redirectPath}`,
		);
	}

	return NextResponse.redirect(`${origin}${redirectPath}`);
}

async function initializeUserIfNeeded(user: User) {
	const dbUser = await db.query.supabaseUserMappings.findFirst({
		where: eq(supabaseUserMappings.supabaseUserId, user.id),
	});
	if (!dbUser) {
		const avatarUrl = getAvatarUrlFromMetadata(
			user.app_metadata.provider,
			user.user_metadata,
		);
		await initializeAccount(user.id, user.email, avatarUrl);
	}
}

function getAvatarUrlFromMetadata(
	provider: User["app_metadata"]["provider"],
	metadata: User["user_metadata"],
): string | undefined {
	switch (provider) {
		case "google":
		case "github":
			return metadata.avatar_url;
		default:
			logger.debug(
				{ provider, metadata },
				"Unknown provider metadata structure",
			);
			return undefined;
	}
}

// store accessToken and refreshToken
async function storeProviderTokens(
	user: User,
	session: Session,
	provider: string,
) {
	const { provider_token, provider_refresh_token } = session;
	if (!provider_token) {
		throw new Error("No provider token found");
	}

	logger.debug(`provider: '${provider}'`);

	const identity = user.identities?.find((identity) => {
		return identity.provider === provider;
	});
	logger.debug({ currentProvider: provider });
	if (!identity) {
		throw new Error(`No identity found for provider: ${provider}`);
	}
	const providerAccountId = identity.id;

	const [dbUser] = await db
		.select({ dbid: users.dbId })
		.from(users)
		.innerJoin(
			supabaseUserMappings,
			eq(users.dbId, supabaseUserMappings.userDbId),
		)
		.where(eq(supabaseUserMappings.supabaseUserId, user.id));
	await db
		.insert(oauthCredentials)
		.values({
			userId: dbUser.dbid,
			provider,
			providerAccountId,
			accessToken: provider_token,
			refreshToken: provider_refresh_token,
		})
		.onConflictDoUpdate({
			target: [
				oauthCredentials.userId,
				oauthCredentials.provider,
				oauthCredentials.providerAccountId,
			],
			set: {
				accessToken: provider_token,
				refreshToken: provider_refresh_token,
				updatedAt: new Date(),
			},
		});
}
