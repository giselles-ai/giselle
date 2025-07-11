/**
 * Base error class for all email-related errors
 */
class EmailError extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		// Maintains proper stack trace for where error was thrown
		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Error thrown when email configuration is invalid or missing
 */
export class EmailConfigurationError extends EmailError {
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, EmailConfigurationError.prototype);
	}
}

/**
 * Error thrown when sending an email fails
 */
export class EmailSendError extends EmailError {
	constructor(
		message: string,
		public readonly cause?: Error,
	) {
		super(message);
		Object.setPrototypeOf(this, EmailSendError.prototype);
	}
}
