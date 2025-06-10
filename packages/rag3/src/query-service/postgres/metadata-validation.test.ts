import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ValidationError } from "../../errors";
import { PostgresQueryService } from "./index";

// Mock dependencies
vi.mock("../../database/postgres", () => ({
	PoolManager: {
		getPool: vi.fn().mockReturnValue({
			connect: vi.fn().mockResolvedValue({
				query: vi.fn().mockResolvedValue({ rows: [] }),
				release: vi.fn(),
			}),
			query: vi.fn(),
		}),
	},
}));

vi.mock("pgvector/pg", () => ({
	toSql: vi.fn((arr) => `[${arr.join(",")}]`),
	registerTypes: vi.fn(),
}));

describe("PostgresQueryService with metadata validation", () => {
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

	const mockEmbedder = {
		embed: vi.fn().mockResolvedValue([1, 2, 3]),
	};

	const mockContextToFilter = vi.fn().mockResolvedValue({
		workspace_id: "test-workspace",
	});

	it("should validate metadata in query results when schema is provided", async () => {
		const metadataSchema = z.object({
			title: z.string(),
			author: z.string(),
			publishedAt: z.string(), // Will be parsed from DB as string
		});

		const mockRows = [
			{
				content: "Test content",
				index: 0,
				title: "Test Document",
				author: "Test Author",
				publishedAt: "2024-01-01",
				similarity: 0.95,
			},
		];

		const { PoolManager } = await import("../../database/postgres");
		vi.mocked(PoolManager.getPool).mockReturnValue({
			connect: vi.fn().mockResolvedValue({
				query: vi.fn().mockResolvedValue({ rows: [] }),
				release: vi.fn(),
			}),
			query: vi.fn().mockResolvedValue({ rows: mockRows }),
		} as ReturnType<typeof PoolManager.getPool>);

		const service = new PostgresQueryService({
			database: mockDatabaseConfig,
			tableName: "test_chunks",
			embedder: mockEmbedder,
			columnMapping: mockColumnMapping,
			contextToFilter: mockContextToFilter,
			metadataSchema,
		});

		const results = await service.search("test query", {}, 10);

		expect(results).toHaveLength(1);
		expect(results[0].metadata).toEqual({
			title: "Test Document",
			author: "Test Author",
			publishedAt: "2024-01-01",
		});
	});

	it("should throw ValidationError when retrieved metadata is invalid", async () => {
		const metadataSchema = z.object({
			title: z.string(),
			author: z.string(),
			count: z.number(), // Expecting number
		});

		const mockRows = [
			{
				content: "Test content",
				index: 0,
				title: "Test Document",
				author: "Test Author",
				count: "not a number", // Invalid
				similarity: 0.95,
			},
		];

		const { PoolManager } = await import("../../database/postgres");
		vi.mocked(PoolManager.getPool).mockReturnValue({
			connect: vi.fn().mockResolvedValue({
				query: vi.fn().mockResolvedValue({ rows: [] }),
				release: vi.fn(),
			}),
			query: vi.fn().mockResolvedValue({ rows: mockRows }),
		} as ReturnType<typeof PoolManager.getPool>);

		const service = new PostgresQueryService({
			database: mockDatabaseConfig,
			tableName: "test_chunks",
			embedder: mockEmbedder,
			columnMapping: {
				...mockColumnMapping,
				count: "count",
			},
			contextToFilter: mockContextToFilter,
			metadataSchema,
		});

		await expect(service.search("test query", {}, 10)).rejects.toThrow(
			ValidationError,
		);
	});

	it("should not validate metadata when schema is not provided", async () => {
		const mockRows = [
			{
				content: "Test content",
				index: 0,
				title: "Test Document",
				author: 123, // Would be invalid if validated
				publishedAt: null, // Would be invalid if validated
				similarity: 0.95,
			},
		];

		const { PoolManager } = await import("../../database/postgres");
		vi.mocked(PoolManager.getPool).mockReturnValue({
			connect: vi.fn().mockResolvedValue({
				query: vi.fn().mockResolvedValue({ rows: [] }),
				release: vi.fn(),
			}),
			query: vi.fn().mockResolvedValue({ rows: mockRows }),
		} as ReturnType<typeof PoolManager.getPool>);

		const service = new PostgresQueryService({
			database: mockDatabaseConfig,
			tableName: "test_chunks",
			embedder: mockEmbedder,
			columnMapping: mockColumnMapping,
			contextToFilter: mockContextToFilter,
			// No metadataSchema provided
		});

		const results = await service.search("test query", {}, 10);

		expect(results).toHaveLength(1);
		expect(results[0].metadata).toEqual({
			title: "Test Document",
			author: 123,
			publishedAt: null,
		});
	});

	it("should handle partial metadata validation errors gracefully", async () => {
		const metadataSchema = z.object({
			title: z.string(),
			tags: z.array(z.string()),
			metadata: z.record(z.string()),
		});

		const mockRows = [
			{
				content: "Valid content",
				index: 0,
				title: "Valid Document",
				tags: ["tag1", "tag2"],
				metadata: { key: "value" },
				similarity: 0.98,
			},
			{
				content: "Invalid content",
				index: 1,
				title: "Invalid Document",
				tags: "not an array", // Invalid
				metadata: { key: "value" },
				similarity: 0.85,
			},
		];

		const { PoolManager } = await import("../../database/postgres");
		vi.mocked(PoolManager.getPool).mockReturnValue({
			connect: vi.fn().mockResolvedValue({
				query: vi.fn().mockResolvedValue({ rows: [] }),
				release: vi.fn(),
			}),
			query: vi.fn().mockResolvedValue({ rows: mockRows }),
		} as ReturnType<typeof PoolManager.getPool>);

		const service = new PostgresQueryService({
			database: mockDatabaseConfig,
			tableName: "test_chunks",
			embedder: mockEmbedder,
			columnMapping: {
				...mockColumnMapping,
				tags: "tags",
				metadata: "metadata",
			},
			contextToFilter: mockContextToFilter,
			metadataSchema,
		});

		// Should throw on the first invalid row
		await expect(service.search("test query", {}, 10)).rejects.toThrow(
			"Invalid metadata retrieved from database",
		);
	});
});
