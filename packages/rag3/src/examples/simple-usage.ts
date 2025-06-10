/**
 * RAG3 Simple Usage Examples
 *
 * 必須カラムのデフォルト化による簡単な使用例
 */

import { z } from "zod/v4";
import { createChunkStore, createQueryService } from "../presets/factories";

// Mock embedder for examples
const mockEmbedder = {
	embed: async (text: string) =>
		new Array(1536).fill(0).map(() => Math.random()),
	embedBatch: async (texts: string[]) =>
		texts.map(() => new Array(1536).fill(0).map(() => Math.random())),
};

/**
 * Example 1: 最小構成（メタデータなし）
 * 必須カラムは自動で設定される
 */
export async function minimalExample() {
	const store = createChunkStore({
		database: {
			connectionString: process.env.DATABASE_URL!,
		},
		tableName: "simple_chunks",
		// カラムマッピングは自動生成される:
		// document_key, content, index, embedding
	});

	const queryService = createQueryService({
		database: {
			connectionString: process.env.DATABASE_URL!,
		},
		tableName: "simple_chunks",
		embedder: mockEmbedder,
		contextToFilter: () => ({}), // フィルタリングなし
	});

	// 使用例
	await store.insert(
		"doc1",
		[
			{
				content: "This is a simple document.",
				index: 0,
				embedding: await mockEmbedder.embed("This is a simple document."),
			},
		],
		{},
	); // 空のメタデータ

	const results = await queryService.search("simple document", {});
	console.log(results);
}

/**
 * Example 2: メタデータ付きの基本的な使用
 * ユーザーメタデータは自動でsnake_caseに変換される
 */
export async function basicWithMetadata() {
	// メタデータスキーマを定義
	const DocumentMetadataSchema = z.object({
		title: z.string(),
		workspaceId: z.string(),
		createdAt: z.date(),
		tags: z.array(z.string()).default([]),
	});

	type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

	const store = createChunkStore({
		database: {
			connectionString: process.env.DATABASE_URL!,
		},
		tableName: "documents",
		metadataSchema: DocumentMetadataSchema,
		// 自動生成されるカラムマッピング:
		// document_key, content, index, embedding
		// title, workspace_id, created_at, tags
	});

	const queryService = createQueryService({
		database: {
			connectionString: process.env.DATABASE_URL!,
		},
		tableName: "documents",
		embedder: mockEmbedder,
		metadataSchema: DocumentMetadataSchema,
		contextToFilter: (context: { workspaceId?: string }) => {
			const filters: Record<string, unknown> = {};
			if (context.workspaceId) {
				filters.workspace_id = context.workspaceId; // snake_caseで指定
			}
			return filters;
		},
	});

	// 使用例
	const metadata: DocumentMetadata = {
		title: "Getting Started Guide",
		workspaceId: "workspace-123",
		createdAt: new Date(),
		tags: ["guide", "tutorial"],
	};

	await store.insert(
		"guide-1",
		[
			{
				content: "This guide will help you get started with our platform.",
				index: 0,
				embedding: await mockEmbedder.embed("getting started guide"),
			},
		],
		metadata,
	);

	// ワークスペースでフィルタリングして検索
	const results = await queryService.search("how to get started", {
		workspaceId: "workspace-123",
	});

	console.log("Search results:", results);
}

/**
 * Example 3: カラム名の部分カスタマイズ
 * 一部のカラム名だけを変更したい場合
 */
export async function partialCustomization() {
	const UserMetadataSchema = z.object({
		userId: z.string(),
		projectName: z.string(),
		isPublic: z.boolean(),
	});

	const store = createChunkStore({
		database: {
			connectionString: process.env.DATABASE_URL!,
		},
		tableName: "user_documents",
		metadataSchema: UserMetadataSchema,
		// 必須カラムの一部をカスタマイズ
		requiredColumnOverrides: {
			content: "text_content", // content → text_content
		},
		// メタデータカラムの一部をカスタマイズ
		metadataColumnOverrides: {
			projectName: "project", // project_name → project
		},
		// 結果的なカラムマッピング:
		// document_key, text_content, index, embedding
		// user_id, project, is_public
	});

	console.log("Store created with partial customization");
}

/**
 * Example 4: 完全手動設定（後方互換性）
 * 従来通りの手動設定も可能
 */
export async function manualConfiguration() {
	const store = createChunkStore({
		database: {
			connectionString: process.env.DATABASE_URL!,
		},
		tableName: "legacy_docs",
		// 完全に手動でカラムマッピングを指定
		columnMapping: {
			documentKey: "doc_id",
			content: "text",
			index: "chunk_index",
			embedding: "vector",
			title: "doc_title",
			workspace: "ws_id",
		},
	});

	console.log("Store created with manual configuration");
}

/**
 * Example 5: 実際のアプリケーション統合例
 */
export class SimpleRAGService {
	private store: ReturnType<typeof createChunkStore>;
	private queryService: ReturnType<typeof createQueryService>;

	constructor(
		databaseUrl: string,
		embedder: {
			embed: (text: string) => Promise<number[]>;
			embedBatch: (texts: string[]) => Promise<number[][]>;
		},
	) {
		// アプリケーション固有のメタデータスキーマ
		const AppMetadataSchema = z.object({
			workspaceId: z.string(),
			userId: z.string(),
			documentType: z.enum(["article", "note", "reference"]),
			isPublic: z.boolean().default(false),
			createdAt: z.date().default(() => new Date()),
			updatedAt: z.date().optional(),
		});

		// ストアとクエリサービスを作成
		this.store = createChunkStore({
			database: { connectionString: databaseUrl },
			tableName: "app_documents",
			metadataSchema: AppMetadataSchema,
			staticContext: {
				app_version: "1.0.0", // 全レコードに追加される静的な値
			},
		});

		this.queryService = createQueryService({
			database: { connectionString: databaseUrl },
			tableName: "app_documents",
			embedder,
			metadataSchema: AppMetadataSchema,
			contextToFilter: (context: {
				workspaceId: string;
				userId?: string;
				documentType?: string;
				includePrivate?: boolean;
			}) => {
				const filters: Record<string, unknown> = {
					workspace_id: context.workspaceId, // 必須フィルタ
				};

				if (context.userId) {
					filters.user_id = context.userId;
				}

				if (context.documentType) {
					filters.document_type = context.documentType;
				}

				if (!context.includePrivate) {
					filters.is_public = true; // プライベート文書を除外
				}

				return filters;
			},
		});
	}

	async addDocument(
		documentKey: string,
		content: string,
		metadata: {
			workspaceId: string;
			userId: string;
			documentType: "article" | "note" | "reference";
			isPublic?: boolean;
		},
	) {
		// シンプルなチャンク分割（実際のアプリではより高度な分割を使用）
		const sentences = content
			.split(/[.!?]+/)
			.filter((s) => s.trim().length > 10);

		const chunks = await Promise.all(
			sentences.map(async (sentence, index) => ({
				content: sentence.trim(),
				index,
				embedding:
					(await this.store.constructor.length) > 0
						? new Array(1536)
								.fill(0)
								.map(() => Math.random()) // Mock
						: [], // 実際の実装
			})),
		);

		await this.store.insert(documentKey, chunks, {
			...metadata,
			createdAt: new Date(),
		});
	}

	async searchDocuments(
		query: string,
		context: {
			workspaceId: string;
			userId?: string;
			documentType?: "article" | "note" | "reference";
			includePrivate?: boolean;
		},
		limit = 10,
	) {
		const results = await this.queryService.search(query, context, limit);

		return results.map((result) => ({
			content: result.chunk.content,
			score: result.similarity,
			metadata: {
				workspaceId: result.metadata.workspaceId,
				userId: result.metadata.userId,
				documentType: result.metadata.documentType,
				isPublic: result.metadata.isPublic,
				createdAt: result.metadata.createdAt,
			},
		}));
	}

	async deleteDocument(documentKey: string) {
		await this.store.deleteByDocumentKey(documentKey);
	}
}

// サービスの使用例
export async function useRAGService() {
	const service = new SimpleRAGService(process.env.DATABASE_URL!, mockEmbedder);

	// 文書を追加
	await service.addDocument(
		"user-guide-001",
		"This comprehensive user guide covers all the essential features of our platform. You'll learn how to navigate the interface, create projects, and collaborate with team members.",
		{
			workspaceId: "workspace-abc",
			userId: "user-123",
			documentType: "article",
			isPublic: true,
		},
	);

	// 検索
	const results = await service.searchDocuments("how to create projects", {
		workspaceId: "workspace-abc",
		documentType: "article",
	});

	console.log("Found documents:", results);
}
