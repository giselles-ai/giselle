import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { ValidationError } from "../errors";
import {
	createChunkStore,
	createDocumentRAG,
	createGitHubRAG,
	createQueryService,
} from "./factories";

// Mock dependencies
vi.mock("../database/postgres", () => ({
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
	registerTypes: vi.fn(),
}));

describe("Factory Functions", () => {
	const mockDatabaseConfig = {
		connectionString: "postgresql://test:test@localhost:5432/test",
	};

	const mockEmbedder = {
		embed: vi.fn().mockResolvedValue([1, 2, 3]),
	};

	describe("createChunkStore", () => {
		it("should create minimal chunk store without metadata", () => {
			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "test_chunks",
			});

			expect(store).toBeDefined();
			// Type should be inferred as PostgresChunkStore<Record<string, never>>
			const metadata: Record<string, never> = {};
			// This should compile without TypeScript errors
			store.insert("doc1", [], metadata);
		});

		it("should create chunk store with document preset", () => {
			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "test_chunks",
				preset: "document",
			});

			expect(store).toBeDefined();
			// Type should be inferred as PostgresChunkStore<DocumentMetadata>
			const metadata = {
				title: "Test Document",
				createdAt: new Date(),
				tags: ["test"],
			};
			// This should compile without TypeScript errors
			store.insert("doc1", [], metadata);
		});

		it("should create chunk store with custom schema", () => {
			const CustomSchema = z.object({
				customField: z.string(),
				customNumber: z.number(),
			});

			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "test_chunks",
				metadataSchema: CustomSchema,
			});

			expect(store).toBeDefined();
			// Type should be inferred correctly
			const metadata = {
				customField: "test",
				customNumber: 42,
			};
			// This should compile without TypeScript errors
			store.insert("doc1", [], metadata);
		});

		it("should validate database configuration", () => {
			expect(() =>
				createChunkStore({
					database: {
						connectionString: "", // Invalid: empty string
					},
					tableName: "test_chunks",
				}),
			).toThrow(ValidationError);
		});

		it("should apply custom mappings for presets", () => {
			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "test_chunks",
				preset: "document",
				customMappings: {
					title: "custom_title_column",
				},
			});

			expect(store).toBeDefined();
		});

		it("should include static context", () => {
			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "test_chunks",
				preset: "simple",
				staticContext: {
					workspace_id: "test-workspace",
				},
			});

			expect(store).toBeDefined();
		});
	});

	describe("createQueryService", () => {
		const mockContextToFilter = vi.fn().mockReturnValue({
			workspace_id: "test",
		});

		it("should create minimal query service", () => {
			const service = createQueryService({
				database: mockDatabaseConfig,
				tableName: "test_chunks",
				embedder: mockEmbedder,
				contextToFilter: mockContextToFilter,
			});

			expect(service).toBeDefined();
		});

		it("should create query service with preset", () => {
			const service = createQueryService({
				database: mockDatabaseConfig,
				tableName: "test_chunks",
				embedder: mockEmbedder,
				preset: "github",
				contextToFilter: mockContextToFilter,
			});

			expect(service).toBeDefined();
		});

		it("should create query service with custom schema", () => {
			const CustomSchema = z.object({
				projectId: z.string(),
				version: z.number(),
			});

			const service = createQueryService({
				database: mockDatabaseConfig,
				tableName: "test_chunks",
				embedder: mockEmbedder,
				metadataSchema: CustomSchema,
				contextToFilter: mockContextToFilter,
			});

			expect(service).toBeDefined();
		});

		it("should include search options", () => {
			const service = createQueryService({
				database: mockDatabaseConfig,
				tableName: "test_chunks",
				embedder: mockEmbedder,
				contextToFilter: mockContextToFilter,
				searchOptions: {
					distanceFunction: "euclidean",
				},
			});

			expect(service).toBeDefined();
		});
	});

	describe("createDocumentRAG", () => {
		it("should create complete document RAG system", () => {
			const rag = createDocumentRAG({
				database: mockDatabaseConfig,
				tableName: "documents",
				embedder: mockEmbedder,
			});

			expect(rag.store).toBeDefined();
			expect(rag.queryService).toBeDefined();

			// Type should be correctly inferred
			const metadata = {
				title: "Test",
				createdAt: new Date(),
				tags: [],
			};
			// This should compile without TypeScript errors
			rag.store.insert("doc1", [], metadata);
		});

		it("should use custom context filter", () => {
			const customFilter = vi.fn().mockReturnValue({
				custom_field: "value",
			});

			const rag = createDocumentRAG({
				database: mockDatabaseConfig,
				tableName: "documents",
				embedder: mockEmbedder,
				contextToFilter: customFilter,
			});

			expect(rag).toBeDefined();
		});
	});

	describe("createGitHubRAG", () => {
		it("should create complete GitHub RAG system", () => {
			const rag = createGitHubRAG({
				database: mockDatabaseConfig,
				tableName: "github_files",
				embedder: mockEmbedder,
			});

			expect(rag.store).toBeDefined();
			expect(rag.queryService).toBeDefined();

			// Type should be correctly inferred
			const metadata = {
				owner: "test-owner",
				repo: "test-repo",
				path: "src/test.ts",
				sha: "abc123",
				type: "file" as const,
				lastModified: new Date(),
			};
			// This should compile without TypeScript errors
			rag.store.insert("doc1", [], metadata);
		});
	});

	describe("Type Safety", () => {
		it("should enforce correct metadata types at compile time", () => {
			// These tests verify that TypeScript compilation catches type errors
			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "test",
				preset: "document",
			});

			// Valid metadata
			const validMetadata = {
				title: "Valid",
				createdAt: new Date(),
				tags: ["test"],
			};

			// This should compile without errors
			store.insert("doc1", [], validMetadata);

			// The following would cause TypeScript compilation errors:
			// store.insert("doc1", [], { invalidField: "test" });
			// store.insert("doc1", [], { title: 123 }); // title should be string
		});

		it("should infer return types correctly", async () => {
			const service = createQueryService({
				database: mockDatabaseConfig,
				tableName: "test",
				embedder: mockEmbedder,
				preset: "github",
				contextToFilter: () => ({}),
			});

			// Mock the search results
			const mockResults = [
				{
					chunk: { content: "test", index: 0 },
					similarity: 0.9,
					metadata: {
						owner: "test",
						repo: "test",
						path: "test.ts",
						sha: "abc",
						type: "file" as const,
						lastModified: new Date(),
					},
				},
			];

			vi.spyOn(service, "search").mockResolvedValue(mockResults);

			const results = await service.search("test query", {});

			// TypeScript should infer the correct metadata type
			expect(results[0].metadata.owner).toBe("test");
			expect(results[0].metadata.type).toBe("file");
		});
	});
});

describe("Error Handling Integration", () => {
	it("should throw ValidationError for invalid database config", () => {
		expect(() =>
			createChunkStore({
				database: {
					connectionString: "",
					poolConfig: {
						max: -1, // Invalid: negative
					},
				},
				tableName: "test",
			}),
		).toThrow(ValidationError);
	});

	it("should provide detailed validation error information", () => {
		try {
			createChunkStore({
				database: {
					connectionString: "",
					poolConfig: {
						max: 101, // Invalid: too large
						idleTimeoutMillis: -100, // Invalid: negative
					},
				},
				tableName: "test",
			});
			expect.fail("Should have thrown ValidationError");
		} catch (error) {
			expect(error).toBeInstanceOf(ValidationError);
			const validationError = error as ValidationError;

			expect(validationError.validationDetails).toHaveLength(3);
			expect(validationError.context?.operation).toBe("validateDatabaseConfig");
		}
	});
});
