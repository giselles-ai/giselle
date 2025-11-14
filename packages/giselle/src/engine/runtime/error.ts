class BaseError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = this.constructor.name;
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export class UsageLimitError extends BaseError {
	readonly message: string;

	constructor(message: string) {
		super(message);
		this.name = "UsageLimitError";
		this.message = message;
	}
}

export function isUsageLimitError(error: unknown): error is UsageLimitError {
	return (
		typeof error === "object" &&
		error !== null &&
		"name" in error &&
		error.name === "UsageLimitError"
	);
}
