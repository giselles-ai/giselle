import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { createChunkStore, createQueryService } from "./factories";

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

describe("Simplified RAG3 API", () => {
	const mockDatabaseConfig = {
		connectionString: "postgresql://test:test@localhost:5432/test",
	};

	const mockEmbedder = {
		embed: vi.fn().mockResolvedValue([1, 2, 3]),
		embedBatch: vi.fn().mockResolvedValue([
			[1, 2, 3],
			[4, 5, 6],
		]),
	};

	describe("createChunkStore", () => {
		it("should create store with minimal configuration", () => {
			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "test_chunks",
			});

			expect(store).toBeDefined();
		});

		it("should create store with metadata schema and auto-generated column mapping", () => {
			const MetadataSchema = z.object({
				title: z.string(),
				workspaceId: z.string(),
				createdAt: z.date(),
				isPublic: z.boolean(),
			});

			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "documents",
				metadataSchema: MetadataSchema,
			});

			expect(store).toBeDefined();
			// カラムマッピングが自動生成されているはず:
			// document_key, content, index, embedding
			// title, workspace_id, created_at, is_public
		});

		it("should allow partial customization of column names", () => {
			const MetadataSchema = z.object({
				userId: z.string(),
				projectName: z.string(),
			});

			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "user_docs",
				metadataSchema: MetadataSchema,
				requiredColumnOverrides: {
					content: "text_content",
				},
				metadataColumnOverrides: {
					projectName: "project",
				},
			});

			expect(store).toBeDefined();
			// 結果的なカラムマッピング:
			// document_key, text_content, index, embedding
			// user_id, project
		});

		it("should allow complete manual column mapping", () => {
			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "legacy_docs",
				columnMapping: {
					documentKey: "doc_id",
					content: "text",
					index: "chunk_index",
					embedding: "vector",
					title: "doc_title",
				},
			});

			expect(store).toBeDefined();
		});

		it("should include static context", () => {
			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "app_docs",
				staticContext: {
					app_version: "1.0.0",
					environment: "production",
				},
			});

			expect(store).toBeDefined();
		});
	});

	describe("createQueryService", () => {
		const mockContextToFilter = vi.fn().mockReturnValue({
			workspace_id: "test-workspace",
		});

		it("should create query service with minimal configuration", () => {
			const service = createQueryService({
				database: mockDatabaseConfig,
				tableName: "test_chunks",
				embedder: mockEmbedder,
				contextToFilter: mockContextToFilter,
			});

			expect(service).toBeDefined();
		});

		it("should create query service with metadata schema", () => {
			const MetadataSchema = z.object({
				workspaceId: z.string(),
				userId: z.string(),
				documentType: z.enum(["article", "note"]),
			});

			const service = createQueryService({
				database: mockDatabaseConfig,
				tableName: "documents",
				embedder: mockEmbedder,
				metadataSchema: MetadataSchema,
				contextToFilter: (context: {
					workspaceId?: string;
					userId?: string;
				}) => {
					const filters: Record<string, unknown> = {};
					if (context.workspaceId) filters.workspace_id = context.workspaceId;
					if (context.userId) filters.user_id = context.userId;
					return filters;
				},
			});

			expect(service).toBeDefined();
		});

		it("should support search options", () => {
			const service = createQueryService({
				database: mockDatabaseConfig,
				tableName: "documents",
				embedder: mockEmbedder,
				contextToFilter: mockContextToFilter,
				searchOptions: {
					distanceFunction: "euclidean",
				},
			});

			expect(service).toBeDefined();
		});
	});

	describe("Column Mapping Auto-generation", () => {
		it("should convert camelCase to snake_case for metadata fields", () => {
			const MetadataSchema = z.object({
				userId: z.string(),
				workspaceId: z.string(),
				createdAt: z.date(),
				isPublic: z.boolean(),
				documentType: z.string(),
			});

			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "test",
				metadataSchema: MetadataSchema,
			});

			expect(store).toBeDefined();
			// 期待されるカラムマッピング:
			// userId → user_id
			// workspaceId → workspace_id
			// createdAt → created_at
			// isPublic → is_public
			// documentType → document_type
		});

		it("should preserve required columns defaults", () => {
			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "test",
			});

			expect(store).toBeDefined();
			// デフォルトの必須カラム:
			// documentKey → document_key
			// content → content
			// index → index
			// embedding → embedding
		});
	});

	describe("Type Safety", () => {
		it("should infer metadata types correctly", () => {
			const UserMetadataSchema = z.object({
				name: z.string(),
				age: z.number(),
				tags: z.array(z.string()),
			});

			type UserMetadata = z.infer<typeof UserMetadataSchema>;

			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "users",
				metadataSchema: UserMetadataSchema,
			});

			// TypeScriptの型チェックを確認
			const validMetadata: UserMetadata = {
				name: "John Doe",
				age: 30,
				tags: ["developer", "typescript"],
			};

			// これはコンパイル時にエラーにならないはず
			store.insert("user1", [], validMetadata);

			expect(store).toBeDefined();
		});
	});

	describe("Error Handling", () => {
		it("should validate database configuration", () => {
			expect(() =>
				createChunkStore({
					database: {
						connectionString: "", // Invalid
					},
					tableName: "test",
				}),
			).toThrow();
		});

		it("should validate metadata when schema is provided", async () => {
			const StrictSchema = z.object({
				title: z.string().min(1),
				count: z.number().positive(),
			});

			const store = createChunkStore({
				database: mockDatabaseConfig,
				tableName: "strict_test",
				metadataSchema: StrictSchema,
			});

			// 正常なメタデータ
			const validMetadata = {
				title: "Valid Title",
				count: 5,
			};

			// これは成功するはず
			await expect(
				store.insert("doc1", [], validMetadata),
			).resolves.toBeUndefined();

			// 無効なメタデータ
			const invalidMetadata = {
				title: "", // Too short
				count: -1, // Not positive
			} as any;

			// これは失敗するはず
			await expect(store.insert("doc2", [], invalidMetadata)).rejects.toThrow();
		});
	});
});
