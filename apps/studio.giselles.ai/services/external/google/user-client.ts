import { logger } from "@/lib/logger";
import { GaxiosError } from "gaxios";
import { OAuth2Client } from "google-auth-library";
import { oauth2 as googleOAuth2 } from "googleapis/build/src/apis/oauth2";

export function buildGoogleUserClient(token: GoogleUserCredential) {
	const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
	if (!clientId) {
		throw new Error("GOOGLE_OAUTH_CLIENT_ID is empty");
	}
	const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
	if (!clientSecret) {
		throw new Error("GOOGLE_OAUTH_CLIENT_SECRET is empty");
	}

	return new GoogleUserClient(token, clientId, clientSecret);
}

// MARK: Errors

class GoogleTokenRefreshError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = this.constructor.name;
		Object.setPrototypeOf(this, GoogleTokenRefreshError.prototype);
	}
}

/**
 * Determines if the given error requires authorization.
 * if return value is true, the user should be redirected to the authorization page.
 *
 * see {@link https://supabase.com/docs/reference/javascript/auth-signinwithoauth}
 *
 * @param error - The error to check.
 * @returns True if the error requires authorization, false otherwise.
 */

export function needsAuthorization(error: unknown) {
	if (error instanceof GoogleTokenRefreshError) {
		return true;
	}
	logger.debug({ error }, "error------------");
	if (error instanceof GaxiosError) {
		return error.status === 401 || error.status === 403 || error.status === 404;
	}
	return false;
}

export type GoogleUserData = {
	name: string;
	email: string;
};

class GoogleUserClient {
	private clientId: string;
	private clientSecret: string;

	constructor(
		private token: GoogleUserCredential,
		clientId: string,
		clientSecret: string,
	) {
		this.clientId = clientId;
		this.clientSecret = clientSecret;
	}

	async getUser(): Promise<GoogleUserData> {
		try {
			const authClient = await this.buildClient();
			logger.debug(
				{
					hasAccessToken: !!this.token.accessToken,
					tokenPrefix: this.token.accessToken?.substring(0, 5),
				},
				"getting user info",
			);

			const oauth2 = googleOAuth2({
				version: "v2",
				auth: authClient,
			});
			const { data } = await oauth2.userinfo.get();
			logger.debug({ data }, "userinfo.get() response");

			const user_data = {
				first_name: data.given_name,
				last_name: data.family_name,
				email: data.email,
			};

			return {
				name: `${user_data.first_name} ${user_data.last_name}`,
				email: user_data.email,
			} as GoogleUserData;
		} catch (error) {
			logger.error(
				{
					error,
					tokenState: {
						hasAccessToken: !!this.token.accessToken,
						hasRefreshToken: !!this.token.refreshToken,
					},
				},
				"Failed to get user info",
			);
			throw error;
		}
	}

	private buildClient() {
		const client = new OAuth2Client(
			this.clientId,
			this.clientSecret,
			process.env.NEXT_PUBLIC_SITE_URL,
		);
		logger.debug("OAuth client initialized");

		client.setCredentials({
			access_token: this.token.accessToken,
			refresh_token: this.token.refreshToken ?? undefined,
		});
		logger.debug("credentials set to OAuth client");

		return client;
	}
}

type GoogleUserCredential = {
	accessToken: string;
	expiresAt: Date | null;
	refreshToken: string | null;
};

export type { GoogleUserClient };
