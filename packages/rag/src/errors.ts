import type { ZodError } from "zod/v4";

/**
 * Base error class
 */
export abstract class RagError extends Error {
	abstract readonly code: string;
	abstract readonly category:
		| "validation"
		| "database"
		| "embedding"
		| "configuration"
		| "operation"
		| "document-loader";

	constructor(
		message: string,
		public readonly cause?: Error,
		public readonly context?: Record<string, unknown>,
	) {
		super(message);
		this.name = this.constructor.name;
	}

	/**
	 * return structured data of the error
	 */
	toJSON() {
		return {
			name: this.name,
			code: this.code,
			category: this.category,
			message: this.message,
			context: this.context,
			cause: this.cause?.message,
			stack: this.stack,
		};
	}
}

/**
 * Validation error
 */
export class ValidationError extends RagError {
	readonly code = "VALIDATION_FAILED";
	readonly category = "validation" as const;

	constructor(
		message: string,
		public readonly zodError?: ZodError,
		context?: Record<string, unknown>,
	) {
		super(message, undefined, context);
	}

	/**
	 * Get detailed validation error information from Zod error
	 */
	get validationDetails(): Array<{
		path: string;
		message: string;
		code: string;
		received?: unknown;
		expected?: unknown;
	}> {
		if (!this.zodError) return [];

		return this.zodError.issues.map((issue) => ({
			path: issue.path.join("."),
			message: issue.message,
			code: issue.code,
			received: "received" in issue ? issue.received : undefined,
			expected: "expected" in issue ? issue.expected : undefined,
		}));
	}

	/**
	 * Create ValidationError from Zod error
	 */
	static fromZodError(
		zodError: ZodError,
		context?: Record<string, unknown>,
	): ValidationError {
		const errorCount = zodError.issues.length;
		const message = `Validation failed with ${errorCount} error${errorCount > 1 ? "s" : ""}`;
		return new ValidationError(message, zodError, context);
	}
}

/**
 * Database error
 */
export class DatabaseError extends RagError {
	readonly category = "database" as const;

	constructor(
		message: string,
		public readonly code: DatabaseErrorCode,
		cause?: Error,
		context?: Record<string, unknown>,
	) {
		super(message, cause, context);
	}

	/**
	 * Helper to create common database errors
	 */
	static connectionFailed(cause?: Error, context?: Record<string, unknown>) {
		return new DatabaseError(
			"Failed to connect to database",
			"CONNECTION_FAILED",
			cause,
			context,
		);
	}

	static queryFailed(
		query: string,
		cause?: Error,
		context?: Record<string, unknown>,
	) {
		return new DatabaseError(
			`Database query failed: ${query}`,
			"QUERY_FAILED",
			cause,
			{ ...context, query },
		);
	}

	static transactionFailed(
		operation: string,
		cause?: Error,
		context?: Record<string, unknown>,
	) {
		return new DatabaseError(
			`Database transaction failed during: ${operation}`,
			"TRANSACTION_FAILED",
			cause,
			{ ...context, operation },
		);
	}
}

export type DatabaseErrorCode =
	| "CONNECTION_FAILED"
	| "QUERY_FAILED"
	| "TRANSACTION_FAILED";

/**
 * Embedding generation error
 */
export class EmbeddingError extends RagError {
	readonly category = "embedding" as const;

	constructor(
		message: string,
		public readonly code: EmbeddingErrorCode,
		cause?: Error,
		context?: Record<string, unknown>,
	) {
		super(message, cause, context);
	}

	/**
	 * Helper to create common embedding errors
	 */
	static apiError(cause?: Error, context?: Record<string, unknown>) {
		return new EmbeddingError(
			"Embedding API request failed",
			"API_ERROR",
			cause,
			context,
		);
	}

	static inputTooLong(message: string, context?: Record<string, unknown>) {
		return new EmbeddingError(message, "INPUT_TOO_LONG", undefined, context);
	}
}

export type EmbeddingErrorCode = "API_ERROR" | "INPUT_TOO_LONG";

/**
 * Configuration error
 */
export class ConfigurationError extends RagError {
	readonly code = "CONFIGURATION_INVALID";
	readonly category = "configuration" as const;

	constructor(
		message: string,
		public readonly field?: string,
		context?: Record<string, unknown>,
	) {
		super(message, undefined, { ...context, field });
	}

	/**
	 * Helper to create common configuration errors
	 */
	static missingField(field: string, context?: Record<string, unknown>) {
		return new ConfigurationError(
			`Required configuration field '${field}' is missing`,
			field,
			context,
		);
	}

	static invalidValue(
		field: string,
		value: unknown,
		expected: string,
		context?: Record<string, unknown>,
	) {
		return new ConfigurationError(
			`Configuration field '${field}' has invalid value. Expected: ${expected}`,
			field,
			{ ...context, value, expected },
		);
	}
}

/**
 * Operation error
 */
export class OperationError extends RagError {
	readonly category = "operation" as const;

	constructor(
		message: string,
		public readonly code: OperationErrorCode,
		cause?: Error,
		context?: Record<string, unknown>,
	) {
		super(message, cause, context);
	}

	/**
	 * Helper to create common operation errors
	 */
	static invalidOperation(
		operation: string,
		reason: string,
		cause?: Error,
		context?: Record<string, unknown>,
	) {
		return new OperationError(
			`Invalid operation '${operation}': ${reason}`,
			"INVALID_OPERATION",
			cause,
			{ ...context, operation, reason },
		);
	}
}

export type OperationErrorCode = "INVALID_OPERATION";

/**
 * Document loader error
 */
export class DocumentLoaderError extends RagError {
	readonly category = "document-loader" as const;

	constructor(
		message: string,
		public readonly code: DocumentLoaderErrorCode,
		cause?: Error,
		context?: Record<string, unknown>,
	) {
		super(message, cause, context);
	}

	/**
	 * Helper to create common document loader errors
	 */
	static notFound(
		resourcePath: string,
		cause?: Error,
		context?: Record<string, unknown>,
	) {
		return new DocumentLoaderError(
			`Document not found: ${resourcePath}`,
			"DOCUMENT_NOT_FOUND",
			cause,
			{ ...context, resourcePath },
		);
	}

	static fetchError(
		source: string,
		operation: string,
		cause?: Error,
		context?: Record<string, unknown>,
	) {
		return new DocumentLoaderError(
			`Document fetch error from '${source}' during ${operation}`,
			"DOCUMENT_FETCH_ERROR",
			cause,
			{ ...context, source, operation },
		);
	}

	static rateLimited(
		source: string,
		retryAfter: string | number | undefined,
		cause?: Error,
		context?: Record<string, unknown>,
	) {
		let retryAfterDate: Date | undefined;
		const occurredAt = new Date();

		if (retryAfter !== undefined) {
			if (typeof retryAfter === "number") {
				retryAfterDate = new Date(occurredAt.getTime() + retryAfter * 1000);
			} else if (typeof retryAfter === "string") {
				const seconds = Number.parseInt(retryAfter, 10);
				if (!Number.isNaN(seconds)) {
					retryAfterDate = new Date(occurredAt.getTime() + seconds * 1000);
				}
			}
		}

		return new DocumentLoaderError(
			`Rate limit exceeded for ${source}`,
			"DOCUMENT_RATE_LIMITED",
			cause,
			{
				...context,
				source,
				retryAfter, // Keep original value
				retryAfterDate,
				occurredAt,
			},
		);
	}

	static tooLarge(
		resourcePath: string,
		size: number,
		maxSize: number,
		cause?: Error,
		context?: Record<string, unknown>,
	) {
		return new DocumentLoaderError(
			`Document '${resourcePath}' exceeds size limit: ${size} > ${maxSize}`,
			"DOCUMENT_TOO_LARGE",
			cause,
			{ ...context, resourcePath, size, maxSize },
		);
	}

	/**
	 * Get the retry-after time as a Date object
	 * @returns Date when the request can be retried, or undefined if not available
	 */
	getRetryAfterDate(): Date | undefined {
		// For DOCUMENT_RATE_LIMITED errors, return pre-calculated date
		if (this.code === "DOCUMENT_RATE_LIMITED" && this.context?.retryAfterDate) {
			const retryAfterDate = this.context.retryAfterDate;
			if (retryAfterDate instanceof Date) {
				return retryAfterDate;
			}
		}
		return undefined;
	}
}

export type DocumentLoaderErrorCode =
	| "DOCUMENT_NOT_FOUND"
	| "DOCUMENT_FETCH_ERROR"
	| "DOCUMENT_RATE_LIMITED"
	| "DOCUMENT_TOO_LARGE";

/**
 * Utility function for error handling
 */

/**
 * Check if the error belongs to a specific category
 */
export function isErrorCategory(
	error: unknown,
	category: RagError["category"],
): error is RagError {
	return error instanceof RagError && error.category === category;
}

/**
 * Check if the error has a specific code
 */
export function isErrorCode<T extends string>(
	error: unknown,
	code: T,
): error is RagError & { code: T } {
	return error instanceof RagError && error.code === code;
}

/**
 * Helper for type-safe error handling
 */
export function handleError<
	T extends Record<string, (error: RagError & { code: string }) => void>,
>(
	error: unknown,
	handlers: T & {
		default?: (error: unknown) => void;
	},
): void {
	if (error instanceof RagError && error.code in handlers) {
		const handler = handlers[error.code];
		if (handler) {
			handler(error);
			return;
		}
	}

	if (handlers.default) {
		handlers.default(error);
	}
}
