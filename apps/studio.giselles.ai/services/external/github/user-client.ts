import { Octokit } from "@octokit/core";
import * as Sentry from "@sentry/nextjs";
import { refreshOauthCredential } from "@/app/(auth)/lib";

// MARK: Factory method

export function buildGitHubUserClient(token: GitHubUserCredential) {
	const clientId = process.env.GITHUB_APP_CLIENT_ID;
	if (!clientId) {
		throw new Error("GITHUB_APP_CLIENT_ID is empty");
	}
	const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
	if (!clientSecret) {
		throw new Error("GITHUB_APP_CLIENT_SECRET is empty");
	}

	const loggerWithSentry = {
		error: (error: Error) => {
			if (process.env.NODE_ENV === "development") {
				console.error(error);
			}
			Sentry.captureException(error);
		},
		warning: (message: string) => {
			if (process.env.NODE_ENV === "development") {
				console.warn(message);
			}
			Sentry.captureMessage(message, "warning");
		},
		info: (message: string) => {
			console.info(message);
		},
	};

	return new GitHubUserClient(
		token,
		clientId,
		clientSecret,
		refreshOauthCredential,
		loggerWithSentry,
	);
}

// MARK: Errors

class GitHubTokenRefreshError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = this.constructor.name;
		Object.setPrototypeOf(this, GitHubTokenRefreshError.prototype);
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
	if (error instanceof GitHubTokenRefreshError) {
		return true;
	}
	if (typeof error === "object" && error !== null && "status" in error) {
		return error.status === 401 || error.status === 403 || error.status === 404;
	}
	return false;
}

// MARK: Types

type GitHubUserCredential = {
	accessToken: string;
	expiresAt: Date | null;
	refreshToken: string | null;
};

type Logger = {
	error: (error: Error) => void;
	warning: (message: string) => void;
	info: (message: string) => void;
};

type RefreshCredentialsFunc = (
	provider: string,
	accessToken: string,
	refreshToken: string,
	expiresAt: Date,
	scope: string,
	tokenType: string,
) => Promise<void>;

// MARK: Client

class GitHubUserClient {
	private clientId: string;
	private clientSecret: string;
	private refreshCredentialsFunc: RefreshCredentialsFunc;
	private logger: Logger;

	constructor(
		private token: GitHubUserCredential,
		clientId: string,
		clientSecret: string,
		refreshCredentialsFunc: RefreshCredentialsFunc,
		logger: Logger,
	) {
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.refreshCredentialsFunc = refreshCredentialsFunc;
		this.logger = logger;
	}

	async getUser() {
		const cli = await this.buildClient();
		const res = await cli.request("GET /user");
		return res.data;
	}

	async getInstallations() {
		// 30 is pretty much the limit of installations, but we should handle the case where there are more
		const maxFetchCount = 30;
		const warningFetchCountBuffer = 5;

		const cli = await this.buildClient();
		const res = await cli.request(
			"GET /user/installations",
			{ per_page: maxFetchCount }, // default is 30
		);
		const totalCount = res.data.total_count;
		if (totalCount > maxFetchCount - warningFetchCountBuffer) {
			this.logger.warning(
				`user has ${totalCount} installations. consider increasing maxFetchCount`,
			);
		}
		return res.data;
	}

	async getRepositories(installationId: number) {
		// 100 is pretty much the limit of installations, but we should handle the case where there are more
		const maxFetchCount = 100;
		const warningFetchCountBuffer = 10;
		const cli = await this.buildClient();
		const res = await cli.request(
			"GET /user/installations/{installation_id}/repositories",
			{
				installation_id: installationId,
				per_page: maxFetchCount,
			},
		);
		const totalCount = res.data.total_count;
		if (totalCount > maxFetchCount - warningFetchCountBuffer) {
			this.logger.warning(
				`user has ${totalCount} repositories. consider increasing maxFetchCount`,
			);
		}
		return res.data;
	}

	private async buildClient() {
		if (this.needsRefreshAccessToken()) {
			await this.refreshAccessToken();
		}

		return new Octokit({
			auth: this.token.accessToken,
			headers: {
				"X-GitHub-Api-Version": "2022-11-28",
			},
		});
	}

	private needsRefreshAccessToken() {
		// Supabase auth doesn't fetch `expiresAt` on login
		return this.token.expiresAt == null || this.token.expiresAt < new Date();
	}

	private async refreshAccessToken() {
		if (this.token.refreshToken == null) {
			throw new GitHubTokenRefreshError("Refresh token is not available");
		}
		const formData = {
			client_id: this.clientId,
			client_secret: this.clientSecret,
			refresh_token: this.token.refreshToken,
			grant_type: "refresh_token",
		};
		const formBody = Object.keys(formData)
			.map(
				(k) =>
					`${encodeURIComponent(k)}=${encodeURIComponent(
						formData[k as keyof typeof formData],
					)}`,
			)
			.join("&");
		const response = await fetch(
			"https://github.com/login/oauth/access_token",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
					Accept: "application/json",
				},
				body: formBody,
			},
		);

		if (!response.ok) {
			throw new GitHubTokenRefreshError("Failed to refresh access token");
		}

		const data = await response.json();
		if ("error" in data) {
			throw new GitHubTokenRefreshError("Failed to refresh access token", {
				cause: data,
			});
		}

		const accessToken = data.access_token;
		const expiresAt = new Date(Date.now() + data.expires_in * 1000);
		const refreshToken = data.refresh_token;
		const scope = data.scope;
		const tokenType = data.token_type;

		try {
			await this.refreshCredentialsFunc(
				"github",
				accessToken,
				refreshToken,
				expiresAt,
				scope,
				tokenType,
			);
		} catch (error) {
			throw new GitHubTokenRefreshError(
				"Failed to save refreshed access token",
				{
					cause: error,
				},
			);
		}

		this.token = { accessToken, expiresAt, refreshToken };
	}
}

export type { GitHubUserClient };
