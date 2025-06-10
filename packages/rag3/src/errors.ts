import type { ZodError, ZodIssue } from "zod/v4";

/**
 * RAG3の基底エラークラス
 */
export abstract class Rag3Error extends Error {
	abstract readonly code: string;
	abstract readonly category:
		| "validation"
		| "database"
		| "embedding"
		| "configuration"
		| "operation";

	constructor(
		message: string,
		public readonly cause?: Error,
		public readonly context?: Record<string, unknown>,
	) {
		super(message);
		this.name = this.constructor.name;
	}

	/**
	 * エラーの詳細情報を含む構造化データを返す
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
 * バリデーションエラー
 */
export class ValidationError extends Rag3Error {
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
	 * Zodエラーから詳細な検証エラー情報を取得
	 */
	get validationDetails(): Array<{
		path: string;
		message: string;
		code: string;
		received?: unknown;
		expected?: unknown;
	}> {
		if (!this.zodError) return [];

		return this.zodError.issues.map((issue: ZodIssue) => ({
			path: issue.path.join("."),
			message: issue.message,
			code: issue.code,
			received: "received" in issue ? issue.received : undefined,
			expected: "expected" in issue ? issue.expected : undefined,
		}));
	}

	/**
	 * Zodエラーから ValidationError を作成
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
 * データベースエラー
 */
export class DatabaseError extends Rag3Error {
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
	 * よく使われるデータベースエラーの作成ヘルパー
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

	static tableNotFound(tableName: string, context?: Record<string, unknown>) {
		return new DatabaseError(
			`Table '${tableName}' does not exist`,
			"TABLE_NOT_FOUND",
			undefined,
			{ ...context, tableName },
		);
	}
}

export type DatabaseErrorCode =
	| "CONNECTION_FAILED"
	| "QUERY_FAILED"
	| "TRANSACTION_FAILED"
	| "TABLE_NOT_FOUND"
	| "CONSTRAINT_VIOLATION"
	| "TIMEOUT"
	| "UNKNOWN";

/**
 * 埋め込み生成エラー
 */
export class EmbeddingError extends Rag3Error {
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
	 * よく使われる埋め込みエラーの作成ヘルパー
	 */
	static apiError(cause?: Error, context?: Record<string, unknown>) {
		return new EmbeddingError(
			"Embedding API request failed",
			"API_ERROR",
			cause,
			context,
		);
	}

	static rateLimitExceeded(
		retryAfter?: number,
		context?: Record<string, unknown>,
	) {
		return new EmbeddingError(
			"Embedding API rate limit exceeded",
			"RATE_LIMIT_EXCEEDED",
			undefined,
			{ ...context, retryAfter },
		);
	}

	static invalidInput(input: string, context?: Record<string, unknown>) {
		return new EmbeddingError(
			"Invalid input for embedding generation",
			"INVALID_INPUT",
			undefined,
			{ ...context, input: input.substring(0, 100) + "..." },
		);
	}
}

export type EmbeddingErrorCode =
	| "API_ERROR"
	| "RATE_LIMIT_EXCEEDED"
	| "INVALID_INPUT"
	| "TIMEOUT"
	| "QUOTA_EXCEEDED"
	| "UNKNOWN";

/**
 * 設定エラー
 */
export class ConfigurationError extends Rag3Error {
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
	 * 設定エラーの作成ヘルパー
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
 * 操作エラー
 */
export class OperationError extends Rag3Error {
	readonly category = "operation" as const;

	constructor(
		message: string,
		public readonly code: OperationErrorCode,
		context?: Record<string, unknown>,
	) {
		super(message, undefined, context);
	}

	/**
	 * 操作エラーの作成ヘルパー
	 */
	static documentNotFound(
		documentKey: string,
		context?: Record<string, unknown>,
	) {
		return new OperationError(
			`Document with key '${documentKey}' not found`,
			"DOCUMENT_NOT_FOUND",
			{ ...context, documentKey },
		);
	}

	static invalidOperation(
		operation: string,
		reason: string,
		context?: Record<string, unknown>,
	) {
		return new OperationError(
			`Invalid operation '${operation}': ${reason}`,
			"INVALID_OPERATION",
			{ ...context, operation, reason },
		);
	}
}

export type OperationErrorCode =
	| "DOCUMENT_NOT_FOUND"
	| "INVALID_OPERATION"
	| "RESOURCE_BUSY"
	| "INSUFFICIENT_PERMISSIONS"
	| "UNKNOWN";

/**
 * エラーハンドリングのユーティリティ関数
 */

/**
 * エラーが特定のカテゴリに属するかチェック
 */
export function isErrorCategory(
	error: unknown,
	category: Rag3Error["category"],
): error is Rag3Error {
	return error instanceof Rag3Error && error.category === category;
}

/**
 * エラーが特定のコードかチェック
 */
export function isErrorCode<T extends string>(
	error: unknown,
	code: T,
): error is Rag3Error & { code: T } {
	return error instanceof Rag3Error && error.code === code;
}

/**
 * 型安全なエラー処理のためのヘルパー
 */
export function handleError<T extends Rag3Error>(
	error: unknown,
	handlers: {
		[K in T["code"]]?: (error: T & { code: K }) => void;
	} & {
		default?: (error: unknown) => void;
	},
): void {
	if (error instanceof Rag3Error) {
		const handler = handlers[error.code as T["code"]];
		if (handler) {
			handler(error as T & { code: T["code"] });
			return;
		}
	}

	if (handlers.default) {
		handlers.default(error);
	}
}
