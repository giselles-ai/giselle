import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { ValidationError } from "../../errors";
import { PostgresChunkStore } from "./index";

// Mock dependencies
vi.mock("../../database/postgres", () => ({
	PoolManager: {
		getPool: vi.fn().mockReturnValue({
			connect: vi.fn().mockResolvedValue({
				query: vi.fn().mockResolvedValue({ rows: [] }),
				release: vi.fn(),
			}),
		}),
	},
}));

vi.mock("pgvector/pg", () => ({
	toSql: vi.fn((arr) => `[${arr.join(",")}]`),
}));

describe("PostgresChunkStore with metadata validation", () => {
	const mockDatabaseConfig = {
		connectionString: "postgresql://test",
	};

	const mockColumnMapping = {
		documentKey: "document_key",
		content: "content",
		index: "index",
		embedding: "embedding",
		title: "title",
		author: "author",
		publishedAt: "published_at",
	};

	it("should insert chunks with valid metadata when schema is provided", async () => {
		const metadataSchema = z.object({
			title: z.string(),
			author: z.string(),
			publishedAt: z.date(),
		});

		const store = new PostgresChunkStore({
			database: mockDatabaseConfig,
			tableName: "test_chunks",
			columnMapping: mockColumnMapping,
			metadataSchema,
		});

		const validMetadata = {
			title: "Test Document",
			author: "Test Author",
			publishedAt: new Date("2024-01-01"),
		};

		const chunks = [
			{
				content: "Test content",
				index: 0,
				embedding: [1, 2, 3],
			},
		];

		// Should not throw
		await expect(
			store.insert("doc1", chunks, validMetadata),
		).resolves.toBeUndefined();
	});

	it("should throw ValidationError with invalid metadata when schema is provided", async () => {
		const metadataSchema = z.object({
			title: z.string(),
			author: z.string(),
			publishedAt: z.date(),
		});

		const store = new PostgresChunkStore({
			database: mockDatabaseConfig,
			tableName: "test_chunks",
			columnMapping: mockColumnMapping,
			metadataSchema,
		});

		const invalidMetadata = {
			title: "Test Document",
			author: 123 as unknown as string, // Invalid: should be string
			publishedAt: new Date(),
		};

		const chunks = [
			{
				content: "Test content",
				index: 0,
				embedding: [1, 2, 3],
			},
		];

		await expect(store.insert("doc1", chunks, invalidMetadata)).rejects.toThrow(
			ValidationError,
		);
	});

	it("should not validate metadata when schema is not provided", async () => {
		const store = new PostgresChunkStore({
			database: mockDatabaseConfig,
			tableName: "test_chunks",
			columnMapping: mockColumnMapping,
			// No metadataSchema provided
		});

		const metadata = {
			title: "Test Document",
			author: 123, // Would be invalid if validated
			publishedAt: "not a date", // Would be invalid if validated
		};

		const chunks = [
			{
				content: "Test content",
				index: 0,
				embedding: [1, 2, 3],
			},
		];

		// Should not throw because no validation occurs
		await expect(
			store.insert("doc1", chunks, metadata),
		).resolves.toBeUndefined();
	});

	it("should provide detailed error information for validation failures", async () => {
		const metadataSchema = z.object({
			title: z.string().min(1),
			author: z.string(),
			tags: z.array(z.string()),
			count: z.number().positive(),
		});

		const store = new PostgresChunkStore({
			database: mockDatabaseConfig,
			tableName: "test_chunks",
			columnMapping: {
				...mockColumnMapping,
				tags: "tags",
				count: "count",
			},
			metadataSchema,
		});

		const invalidMetadata = {
			title: "", // Too short
			author: "Author",
			tags: ["valid", 123 as unknown as string], // Contains non-string
			count: -5, // Not positive
		};

		const chunks = [
			{
				content: "Test content",
				index: 0,
				embedding: [1, 2, 3],
			},
		];

		try {
			await store.insert("doc1", chunks, invalidMetadata);
			expect.fail("Should have thrown ValidationError");
		} catch (error) {
			expect(error).toBeInstanceOf(ValidationError);
			expect(error.message).toContain("Validation failed");
			expect(error.zodError).toBeDefined();
		}
	});
});
