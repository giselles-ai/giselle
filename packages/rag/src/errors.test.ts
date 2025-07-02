import { describe, expect, it } from "vitest";
import { ZodError, z } from "zod/v4";
import {
	ConfigurationError,
	DatabaseError,
	DocumentLoaderError,
	EmbeddingError,
	handleError,
	isErrorCategory,
	isErrorCode,
	OperationError,
	ValidationError,
} from "./errors";

describe("Enhanced Error System", () => {
	describe("ValidationError", () => {
		it("should create validation error from Zod error", () => {
			const schema = z.object({
				name: z.string(),
				age: z.number().positive(),
			});

			const result = schema.safeParse({
				name: 123, // Invalid: should be string
				age: -5, // Invalid: should be positive
			});

			expect(result.success).toBe(false);

			if (!result.success) {
				const error = ValidationError.fromZodError(result.error, {
					operation: "test",
				});

				expect(error).toBeInstanceOf(ValidationError);
				expect(error.code).toBe("VALIDATION_FAILED");
				expect(error.category).toBe("validation");
				expect(error.context?.operation).toBe("test");
				expect(error.validationDetails).toHaveLength(2);

				const details = error.validationDetails;
				expect(details[0].path).toBe("name");
				expect(details[0].code).toBe("invalid_type");
				expect(details[1].path).toBe("age");
				expect(details[1].code).toBe("too_small");
			}
		});

		it("should provide structured error information", () => {
			const schema = z.object({ email: z.string().email() });
			const result = schema.safeParse({ email: "invalid-email" });

			if (!result.success) {
				const error = ValidationError.fromZodError(result.error);
				const json = error.toJSON();

				expect(json.name).toBe("ValidationError");
				expect(json.code).toBe("VALIDATION_FAILED");
				expect(json.category).toBe("validation");
				expect(json.message).toContain("Validation failed");
			}
		});
	});

	describe("DatabaseError", () => {
		it("should create connection failed error", () => {
			const originalError = new Error("Connection timeout");
			const error = DatabaseError.connectionFailed(originalError, {
				host: "localhost",
				port: 5432,
			});

			expect(error.code).toBe("CONNECTION_FAILED");
			expect(error.category).toBe("database");
			expect(error.cause).toBe(originalError);
			expect(error.context?.host).toBe("localhost");
			expect(error.context?.port).toBe(5432);
		});

		it("should create query failed error", () => {
			const query = "SELECT * FROM users";
			const error = DatabaseError.queryFailed(query, undefined, {
				table: "users",
			});

			expect(error.code).toBe("QUERY_FAILED");
			expect(error.message).toContain(query);
			expect(error.context?.query).toBe(query);
			expect(error.context?.table).toBe("users");
		});

		it("should create transaction failed error", () => {
			const operation = "insert chunks";
			const error = DatabaseError.transactionFailed(operation, undefined, {
				documentKey: "doc1",
			});

			expect(error.code).toBe("TRANSACTION_FAILED");
			expect(error.message).toContain(operation);
			expect(error.context?.operation).toBe(operation);
			expect(error.context?.documentKey).toBe("doc1");
		});
	});

	describe("EmbeddingError", () => {
		it("should create API error", () => {
			const apiError = new Error("Rate limit exceeded");
			const error = EmbeddingError.apiError(apiError, {
				model: "text-embedding-ada-002",
			});

			expect(error.code).toBe("API_ERROR");
			expect(error.category).toBe("embedding");
			expect(error.cause).toBe(apiError);
			expect(error.context?.model).toBe("text-embedding-ada-002");
		});
	});

	describe("ConfigurationError", () => {
		it("should create missing field error", () => {
			const error = ConfigurationError.missingField("apiKey", {
				component: "embedder",
			});

			expect(error.code).toBe("CONFIGURATION_INVALID");
			expect(error.category).toBe("configuration");
			expect(error.field).toBe("apiKey");
			expect(error.context?.component).toBe("embedder");
		});

		it("should create invalid value error", () => {
			const error = ConfigurationError.invalidValue(
				"timeout",
				"invalid",
				"positive number",
				{ component: "database" },
			);

			expect(error.message).toContain("timeout");
			expect(error.message).toContain("positive number");
			expect(error.context?.value).toBe("invalid");
			expect(error.context?.expected).toBe("positive number");
		});
	});

	describe("OperationError", () => {
		it("should create invalid operation error", () => {
			const error = OperationError.invalidOperation(
				"search",
				"index not ready",
				undefined,
				{ indexName: "embeddings" },
			);

			expect(error.code).toBe("INVALID_OPERATION");
			expect(error.context?.operation).toBe("search");
			expect(error.context?.reason).toBe("index not ready");
		});

		it("should create invalid operation error with cause", () => {
			const originalError = new Error("Index connection failed");
			const error = OperationError.invalidOperation(
				"search",
				"index not ready",
				originalError,
				{ indexName: "embeddings" },
			);

			expect(error.code).toBe("INVALID_OPERATION");
			expect(error.cause).toBe(originalError);
			expect(error.context?.operation).toBe("search");
			expect(error.context?.reason).toBe("index not ready");
		});
	});

	describe("DocumentLoaderError", () => {
		it("should create rate limited error with number retry-after", () => {
			const error = DocumentLoaderError.rateLimited(
				"github",
				60, // 60 seconds
				undefined,
				{ endpoint: "/api/v1/repos" },
			);

			expect(error.code).toBe("DOCUMENT_RATE_LIMITED");
			expect(error.category).toBe("document-loader");
			expect(error.context?.source).toBe("github");
			expect(error.context?.retryAfter).toBe(60);
			expect(error.context?.retryAfterDate).toBeInstanceOf(Date);
			expect(error.context?.occurredAt).toBeInstanceOf(Date);

			// Check that retryAfterDate is approximately 60 seconds in the future
			const retryAfterDate = error.context?.retryAfterDate as Date;
			const occurredAt = error.context?.occurredAt as Date;
			const diffMs = retryAfterDate.getTime() - occurredAt.getTime();
			expect(diffMs).toBeGreaterThanOrEqual(59000); // Allow small timing variance
			expect(diffMs).toBeLessThanOrEqual(61000);
		});

		it("should create rate limited error with string retry-after", () => {
			const error = DocumentLoaderError.rateLimited(
				"github",
				"120", // 120 seconds as string
				undefined,
				{ endpoint: "/api/v1/repos" },
			);

			expect(error.code).toBe("DOCUMENT_RATE_LIMITED");
			expect(error.context?.retryAfter).toBe("120");
			expect(error.context?.retryAfterDate).toBeInstanceOf(Date);

			// Check that retryAfterDate is approximately 120 seconds in the future
			const retryAfterDate = error.context?.retryAfterDate as Date;
			const occurredAt = error.context?.occurredAt as Date;
			const diffMs = retryAfterDate.getTime() - occurredAt.getTime();
			expect(diffMs).toBeGreaterThanOrEqual(119000);
			expect(diffMs).toBeLessThanOrEqual(121000);
		});

		it("should create rate limited error without retry-after", () => {
			const error = DocumentLoaderError.rateLimited(
				"github",
				undefined,
				undefined,
				{ endpoint: "/api/v1/repos" },
			);

			expect(error.code).toBe("DOCUMENT_RATE_LIMITED");
			expect(error.context?.retryAfter).toBeUndefined();
			expect(error.context?.retryAfterDate).toBeUndefined();
			expect(error.context?.occurredAt).toBeInstanceOf(Date);
		});

		it("should return retryAfterDate for rate limited errors", () => {
			const error = DocumentLoaderError.rateLimited("github", 30);
			const retryAfterDate = error.getRetryAfterDate();

			expect(retryAfterDate).toBeInstanceOf(Date);
			expect(retryAfterDate).toBe(error.context?.retryAfterDate);
		});

		it("should return undefined for non-rate-limited errors", () => {
			const notFoundError = DocumentLoaderError.notFound("/path/to/file");
			const fetchError = DocumentLoaderError.fetchError(
				"github",
				"fetching file",
			);
			const tooLargeError = DocumentLoaderError.tooLarge(
				"/path/to/file",
				1000,
				500,
			);

			expect(notFoundError.getRetryAfterDate()).toBeUndefined();
			expect(fetchError.getRetryAfterDate()).toBeUndefined();
			expect(tooLargeError.getRetryAfterDate()).toBeUndefined();
		});
	});

	describe("Error Utilities", () => {
		it("should check error category", () => {
			const dbError = DatabaseError.connectionFailed();
			const validationError = ValidationError.fromZodError(new ZodError([]));

			expect(isErrorCategory(dbError, "database")).toBe(true);
			expect(isErrorCategory(dbError, "validation")).toBe(false);
			expect(isErrorCategory(validationError, "validation")).toBe(true);
			expect(isErrorCategory(new Error("generic"), "database")).toBe(false);
		});

		it("should check error code", () => {
			const dbError = DatabaseError.connectionFailed();
			const embeddingError = EmbeddingError.apiError();

			expect(isErrorCode(dbError, "CONNECTION_FAILED")).toBe(true);
			expect(isErrorCode(dbError, "API_ERROR")).toBe(false);
			expect(isErrorCode(embeddingError, "API_ERROR")).toBe(true);
			expect(isErrorCode(new Error("generic"), "CONNECTION_FAILED")).toBe(
				false,
			);
		});

		it("should handle errors with type safety", () => {
			const dbError = DatabaseError.queryFailed("SELECT 1");
			const embeddingError = EmbeddingError.apiError();
			const genericError = new Error("Unknown error");

			let handledError: string | null = null;

			// Test database error handling
			handleError(dbError, {
				QUERY_FAILED: (error) => {
					handledError = `DB Query Failed: ${error.context?.query}`;
				},
				default: () => {
					handledError = "Unknown";
				},
			});
			expect(handledError).toBe("DB Query Failed: SELECT 1");

			// Test embedding error handling
			handledError = null;
			handleError(embeddingError, {
				API_ERROR: (error) => {
					handledError = `API Error: ${error.message}`;
				},
				default: () => {
					handledError = "Unknown";
				},
			});
			expect(handledError).toBe("API Error: Embedding API request failed");

			// Test generic error handling
			handledError = null;
			handleError(genericError, {
				QUERY_FAILED: () => {
					handledError = "DB Error";
				},
				default: (error) => {
					handledError = `Generic: ${(error as Error).message}`;
				},
			});
			expect(handledError).toBe("Generic: Unknown error");
		});
	});

	describe("Error JSON Serialization", () => {
		it("should serialize error to JSON", () => {
			const error = DatabaseError.connectionFailed(
				new Error("Network timeout"),
				{ host: "localhost", port: 5432 },
			);

			const json = error.toJSON();

			expect(json.name).toBe("DatabaseError");
			expect(json.code).toBe("CONNECTION_FAILED");
			expect(json.category).toBe("database");
			expect(json.message).toBe("Failed to connect to database");
			expect(json.context).toEqual({ host: "localhost", port: 5432 });
			expect(json.cause).toBe("Network timeout");
			expect(json.stack).toBeDefined();
		});
	});
});
