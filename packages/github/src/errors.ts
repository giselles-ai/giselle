/**
 * Symbol used for identifying Error instances.
 * Enables checking if an error is an instance of GitHubError across package versions.
 */
const marker = "github.error";
const symbol = Symbol.for(marker);

/**
 * Custom error class for GitHub related errors.
 * @extends Error
 */
export class GitHubError extends Error {
	private readonly [symbol] = true; // used in isInstance

	/**
	 * The underlying cause of the error, if any.
	 */
	readonly cause?: unknown;

	/**
	 * Creates a GitHub Error.
	 *
	 * @param {Object} params - The parameters for creating the error.
	 * @param {string} params.name - The name of the error.
	 * @param {string} params.message - The error message.
	 * @param {unknown} [params.cause] - The underlying cause of the error.
	 */
	constructor({
		name,
		message,
		cause,
	}: {
		name: string;
		message: string;
		cause?: unknown;
	}) {
		super(message);

		this.name = name;
		this.cause = cause;
	}

	/**
	 * Checks if the given error is a GitHub Error.
	 * @param {unknown} error - The error to check.
	 * @returns {boolean} True if the error is a GitHub Error, false otherwise.
	 */
	static isInstance(error: unknown): error is GitHubError {
		return GitHubError.hasMarker(error, marker);
	}

	protected static hasMarker(error: unknown, marker: string): boolean {
		const markerSymbol = Symbol.for(marker);
		return (
			error != null &&
			typeof error === "object" &&
			markerSymbol in error &&
			typeof error[markerSymbol] === "boolean" &&
			error[markerSymbol] === true
		);
	}
}

/**
 * Symbol used for identifying Webhook Unauthorized Error instances.
 */
const webhookUnauthorizedMarker = "github.webhook.unauthorized.error";
const webhookUnauthorizedSymbol = Symbol.for(webhookUnauthorizedMarker);

/**
 * Custom error class for GitHub Webhook Unauthorized related errors.
 * @extends GitHubError
 */
export class GitHubWebhookUnauthorizedError extends GitHubError {
	private readonly [webhookUnauthorizedSymbol] = true; // used in isInstance

	/**
	 * Creates a GitHub Webhook Unauthorized Error.
	 *
	 * @param {Object} params - The parameters for creating the error.
	 * @param {string} params.message - The error message.
	 * @param {unknown} [params.cause] - The underlying cause of the error.
	 */
	constructor(args?: {
		message?: string;
		cause?: unknown;
	}) {
		super({
			name: "GitHubWebhookUnauthorizedError",
			message: args?.message ?? "GitHub error",
			cause: args?.cause,
		});
	}

	/**
	 * Checks if the given error is a GitHub Webhook Unauthorized Error.
	 * @param {unknown} error - The error to check.
	 * @returns {boolean} True if the error is a GitHub Webhook Unauthorized Error, false otherwise.
	 */
	static isInstance(error: unknown): error is GitHubWebhookUnauthorizedError {
		return GitHubError.hasMarker(error, webhookUnauthorizedMarker);
	}
}
