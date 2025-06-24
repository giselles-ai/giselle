import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { PoolManager } from "../../database/postgres";
import { ConfigurationError, DatabaseError } from "../../errors";
import { createPostgresChunkStore } from "./postgres-chunk-store";

// Mock dependencies
vi.mock("../../database/postgres");
vi.mock("../../database/postgres/pgvector-registry", () => ({
	ensurePgVectorTypes: vi.fn(),
	clearPgVectorCache: vi.fn(),
}));

describe("postgres-chunk-store", () => {
	const mockClient = {
		query: vi.fn(),
		release: vi.fn(),
	};

	const mockPool = {
		connect: vi.fn().mockResolvedValue(mockClient),
	};

	const testConfig = {
		database: { connectionString: "postgresql://test" },
		tableName: "test_embeddings",
		columnMapping: {
			documentKey: "path",
			chunkContent: "content",
			chunkIndex: "chunk_idx",
			embedding: "embedding",
			fileSha: "file_sha",
			version: "file_sha",
		},
		metadataSchema: z.object({
			fileSha: z.string(),
		}),
		scope: {
			repository_index_db_id: 123,
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(PoolManager.getPool).mockReturnValue(mockPool as unknown as Pool);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("getDocumentVersions", () => {
		it("should return document versions successfully", async () => {
			const mockRows = [
				{ document_key: "file1.ts", version: "sha123" },
				{ document_key: "file2.ts", version: "sha456" },
			];
			mockClient.query.mockResolvedValue({ rows: mockRows });

			const store = createPostgresChunkStore(testConfig);
			const result = await store.getDocumentVersions?.();

			expect(result).toEqual([
				{ documentKey: "file1.ts", version: "sha123" },
				{ documentKey: "file2.ts", version: "sha456" },
			]);

			// Verify the query
			expect(mockClient.query).toHaveBeenCalledWith(
				expect.stringContaining("SELECT DISTINCT"),
				[123], // scope value
			);
			expect(mockClient.query.mock.calls[0][0]).toMatch(
				/path.*as document_key/,
			);
			expect(mockClient.query.mock.calls[0][0]).toMatch(/file_sha.*as version/);
			expect(mockClient.query.mock.calls[0][0]).toMatch(
				/WHERE.*repository_index_db_id.*=.*\$1/,
			);
		});

		it("should handle empty results", async () => {
			mockClient.query.mockResolvedValue({ rows: [] });

			const store = createPostgresChunkStore(testConfig);
			const result = await store.getDocumentVersions?.();

			expect(result).toEqual([]);
		});

		it("should throw DatabaseError on query failure", async () => {
			const testError = new Error("Database connection failed");
			mockClient.query.mockRejectedValue(testError);

			const store = createPostgresChunkStore(testConfig);

			await expect(store.getDocumentVersions?.()).rejects.toThrow(
				DatabaseError,
			);
			expect(mockClient.release).toHaveBeenCalled();
		});

		it("should handle multiple scope conditions", async () => {
			const multiScopeConfig = {
				...testConfig,
				scope: {
					repository_index_db_id: 123,
					team_id: 456,
				},
			};

			mockClient.query.mockResolvedValue({ rows: [] });

			const store = createPostgresChunkStore(multiScopeConfig);
			await store.getDocumentVersions?.();

			expect(mockClient.query).toHaveBeenCalledWith(
				expect.stringContaining("AND"),
				[123, 456], // both scope values
			);
		});

		it("should throw error if columnMapping doesn't have version", async () => {
			const configWithoutVersion = {
				...testConfig,
				columnMapping: {
					documentKey: "path",
					chunkContent: "content",
					chunkIndex: "chunk_idx",
					embedding: "embedding",
					fileSha: "file_sha",
					// No version mapping
				},
			};

			const store = createPostgresChunkStore(configWithoutVersion);

			await expect(store.getDocumentVersions?.()).rejects.toThrow(
				ConfigurationError,
			);

			// Also check that it's thrown before trying to connect to DB
			expect(mockPool.connect).not.toHaveBeenCalled();
		});

		it("should escape identifiers to prevent SQL injection", async () => {
			mockClient.query.mockResolvedValue({ rows: [] });

			const store = createPostgresChunkStore(testConfig);
			await store.getDocumentVersions?.();

			const query = mockClient.query.mock.calls[0][0];
			// Should have escaped identifiers (quoted)
			expect(query).toMatch(/"path"/);
			expect(query).toMatch(/"file_sha"/);
			expect(query).toMatch(/"test_embeddings"/);
		});
	});
});
