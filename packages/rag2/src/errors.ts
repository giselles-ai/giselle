// Standardized error classes for RAG2 package

/**
 * Base error class for all RAG2-related errors
 */
export abstract class RAGError extends Error {
	abstract readonly code: string;
	abstract readonly category:
		| "validation"
		| "database"
		| "api"
		| "configuration"
		| "processing";

	constructor(
		message: string,
		public readonly cause?: unknown,
	) {
		super(message);
		this.name = this.constructor.name;

		// Maintains proper stack trace for where our error was thrown (V8 only)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	/**
	 * Convert error to JSON for logging/debugging
	 */
	toJSON() {
		return {
			name: this.name,
			code: this.code,
			category: this.category,
			message: this.message,
			cause: this.cause instanceof Error ? this.cause.message : this.cause,
			stack: this.stack,
		};
	}
}

/**
 * Validation-related errors (invalid input, schema validation failures, etc.)
 */
export class ValidationError extends RAGError {
	readonly code = "VALIDATION_ERROR";
	readonly category = "validation" as const;

	constructor(
		message: string,
		public readonly field?: string,
		cause?: unknown,
	) {
		super(message, cause);
	}

	static invalidInput(
		field: string,
		expected: string,
		received: unknown,
	): ValidationError {
		return new ValidationError(
			`Invalid input for field '${field}': expected ${expected}, received ${typeof received}`,
			field,
		);
	}

	static missingRequired(field: string): ValidationError {
		return new ValidationError(`Required field '${field}' is missing`, field);
	}

	static invalidFormat(field: string, format: string): ValidationError {
		return new ValidationError(
			`Field '${field}' has invalid format: ${format}`,
			field,
		);
	}
}

/**
 * Database-related errors (connection failures, query errors, etc.)
 */
export class DatabaseError extends RAGError {
	readonly code = "DATABASE_ERROR";
	readonly category = "database" as const;

	constructor(
		message: string,
		public readonly operation?: string,
		cause?: unknown,
	) {
		super(message, cause);
	}

	static connectionFailed(cause?: unknown): DatabaseError {
		return new DatabaseError("Failed to connect to database", "connect", cause);
	}

	static queryFailed(operation: string, cause?: unknown): DatabaseError {
		return new DatabaseError(
			`Database query failed: ${operation}`,
			operation,
			cause,
		);
	}

	static insertFailed(table: string, cause?: unknown): DatabaseError {
		return new DatabaseError(
			`Failed to insert data into table '${table}'`,
			"insert",
			cause,
		);
	}

	static deleteFailed(table: string, cause?: unknown): DatabaseError {
		return new DatabaseError(
			`Failed to delete data from table '${table}'`,
			"delete",
			cause,
		);
	}
}

/**
 * External API-related errors (OpenAI, GitHub, etc.)
 */
export class APIError extends RAGError {
	readonly code = "API_ERROR";
	readonly category = "api" as const;

	constructor(
		message: string,
		public readonly service: string,
		public readonly statusCode?: number,
		cause?: unknown,
	) {
		super(message, cause);
	}

	static rateLimited(service: string, retryAfter?: number): APIError {
		const message = retryAfter
			? `Rate limited by ${service}. Retry after ${retryAfter} seconds`
			: `Rate limited by ${service}`;
		return new APIError(message, service, 429);
	}

	static unauthorized(service: string): APIError {
		return new APIError(`Unauthorized access to ${service}`, service, 401);
	}

	static requestFailed(
		service: string,
		statusCode: number,
		message: string,
	): APIError {
		return new APIError(
			`${service} API request failed: ${message}`,
			service,
			statusCode,
		);
	}
}

/**
 * Configuration-related errors (missing environment variables, invalid config, etc.)
 */
export class ConfigurationError extends RAGError {
	readonly code = "CONFIGURATION_ERROR";
	readonly category = "configuration" as const;

	constructor(
		message: string,
		public readonly configKey?: string,
		cause?: unknown,
	) {
		super(message, cause);
	}

	static missingEnvVar(key: string): ConfigurationError {
		return new ConfigurationError(
			`Required environment variable '${key}' is not set`,
			key,
		);
	}

	static invalidConfig(key: string, expected: string): ConfigurationError {
		return new ConfigurationError(
			`Invalid configuration for '${key}': expected ${expected}`,
			key,
		);
	}
}

/**
 * Processing-related errors (chunking, embedding, pipeline errors, etc.)
 */
export class ProcessingError extends RAGError {
	readonly code = "PROCESSING_ERROR";
	readonly category = "processing" as const;

	constructor(
		message: string,
		public readonly stage?: string,
		cause?: unknown,
	) {
		super(message, cause);
	}

	static chunkingFailed(cause?: unknown): ProcessingError {
		return new ProcessingError(
			"Failed to chunk document content",
			"chunking",
			cause,
		);
	}

	static embeddingFailed(cause?: unknown): ProcessingError {
		return new ProcessingError(
			"Failed to generate embeddings",
			"embedding",
			cause,
		);
	}

	static pipelineFailed(stage: string, cause?: unknown): ProcessingError {
		return new ProcessingError(
			`Pipeline failed at stage: ${stage}`,
			stage,
			cause,
		);
	}
}

/**
 * Utility function to wrap unknown errors in RAGError
 */
export function wrapError(error: unknown, defaultMessage: string): RAGError {
	if (error instanceof RAGError) {
		return error;
	}

	if (error instanceof Error) {
		return new ProcessingError(error.message, undefined, error);
	}

	return new ProcessingError(defaultMessage, undefined, error);
}

/**
 * Type guard to check if error is a RAGError
 */
export function isRAGError(error: unknown): error is RAGError {
	return error instanceof RAGError;
}
