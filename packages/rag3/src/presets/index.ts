/**
 * RAG3 のデフォルト設定とユーティリティ
 */

import type { z } from "zod/v4";
import type { ChunkStore } from "../chunk-store/types";
import { LineChunker } from "../chunker";
import type { ColumnMapping, RequiredColumns } from "../database/types";
import type { DocumentLoader } from "../document-loader/types";
import { OpenAIEmbedder } from "../embedder";
import { IngestPipeline } from "../ingest";

/**
 * 必須カラムのデフォルトマッピング
 */
export const DEFAULT_REQUIRED_COLUMNS: RequiredColumns = {
	documentKey: "document_key",
	content: "content",
	index: "index",
	embedding: "embedding",
} as const;

/**
 * 文字列をsnake_caseに変換
 */
function toSnakeCase(str: string): string {
	return str
		.replace(/([A-Z])/g, "_$1")
		.toLowerCase()
		.replace(/^_/, "");
}

/**
 * チャンクストア設定のオプション
 */
export interface ChunkStoreConfig<TMetadata extends Record<string, unknown>> {
	/**
	 * データベース設定
	 */
	database: {
		connectionString: string;
		poolConfig?: {
			max?: number;
			idleTimeoutMillis?: number;
			connectionTimeoutMillis?: number;
		};
	};
	/**
	 * テーブル名
	 */
	tableName: string;
	/**
	 * メタデータのZodスキーマ（省略可能）
	 */
	metadataSchema?: z.ZodType<TMetadata>;
	/**
	 * 必須カラムのカスタマイズ（省略可能）
	 */
	requiredColumnOverrides?: Partial<RequiredColumns>;
	/**
	 * メタデータカラムのカスタマイズ（省略可能）
	 */
	metadataColumnOverrides?: Partial<Record<keyof TMetadata, string>>;
	/**
	 * 完全に手動でカラムマッピングを指定（省略可能）
	 * これを指定すると他のマッピング設定は無視される
	 */
	columnMapping?: ColumnMapping<TMetadata>;
	/**
	 * 全レコードに適用される静的な値
	 */
	staticContext?: Record<string, unknown>;
}

/**
 * クエリサービス設定のオプション
 */
export interface QueryServiceConfig<
	TContext,
	TMetadata extends Record<string, unknown>,
> {
	/**
	 * データベース設定
	 */
	database: {
		connectionString: string;
		poolConfig?: {
			max?: number;
			idleTimeoutMillis?: number;
			connectionTimeoutMillis?: number;
		};
	};
	/**
	 * テーブル名
	 */
	tableName: string;
	/**
	 * 埋め込みモデル（省略可能、デフォルトのOpenAI embedderを使用）
	 */
	embedder?: {
		embed: (text: string) => Promise<number[]>;
		embedBatch: (texts: string[]) => Promise<number[][]>;
	};
	/**
	 * コンテキストからフィルタ条件への変換
	 */
	contextToFilter: (
		context: TContext,
	) => Record<string, unknown> | Promise<Record<string, unknown>>;
	/**
	 * メタデータのZodスキーマ（省略可能）
	 */
	metadataSchema?: z.ZodType<TMetadata>;
	/**
	 * 必須カラムのカスタマイズ（省略可能）
	 */
	requiredColumnOverrides?: Partial<RequiredColumns>;
	/**
	 * メタデータカラムのカスタマイズ（省略可能）
	 */
	metadataColumnOverrides?: Partial<Record<keyof TMetadata, string>>;
	/**
	 * 完全に手動でカラムマッピングを指定（省略可能）
	 */
	columnMapping?: ColumnMapping<TMetadata>;
	/**
	 * 検索時の追加オプション
	 */
	searchOptions?: {
		distanceFunction?: "cosine" | "euclidean" | "inner_product";
	};
}

/**
 * 型ガード: ZodTypeにshapeプロパティがあるかチェック（型安全版）
 */
function hasShapeProperty<T>(
	schema: z.ZodType<T>,
): schema is z.ZodType<T> & { shape: z.ZodRawShape } {
	// 型安全なプロパティチェック
	if (!("shape" in schema)) {
		return false;
	}

	// shapeプロパティが存在する場合、その型をチェック
	// 型アサーションを避けて安全にアクセス
	const potentialShape = (schema as { shape?: unknown }).shape;
	return (
		potentialShape !== null &&
		potentialShape !== undefined &&
		typeof potentialShape === "object" &&
		!Array.isArray(potentialShape)
	);
}

/**
 * メタデータスキーマからColumnMappingを自動生成（型安全版）
 */
export function createColumnMapping<TMetadata extends Record<string, unknown>>(
	options: {
		metadataSchema?: z.ZodType<TMetadata>;
		requiredColumnOverrides?: Partial<RequiredColumns>;
		metadataColumnOverrides?: Partial<Record<keyof TMetadata, string>>;
	} = {},
): ColumnMapping<TMetadata> {
	const { metadataSchema, requiredColumnOverrides, metadataColumnOverrides } =
		options;

	// 必須カラムを設定
	const requiredColumns: RequiredColumns = {
		...DEFAULT_REQUIRED_COLUMNS,
		...requiredColumnOverrides,
	};

	// メタデータカラムを段階的に構築（型安全）
	const metadataColumns: Record<string, string> = {};

	if (metadataSchema && hasShapeProperty(metadataSchema)) {
		// ZodObjectの場合、フィールド名からカラム名を自動生成
		const shape = metadataSchema.shape;
		const fieldNames = Object.keys(shape);

		for (const fieldName of fieldNames) {
			// 型安全なキーアクセス
			const customMapping =
				metadataColumnOverrides?.[fieldName as keyof TMetadata];
			if (customMapping) {
				// カスタムマッピングが指定されている場合
				metadataColumns[fieldName] = customMapping;
			} else {
				// デフォルトはsnake_caseに変換
				metadataColumns[fieldName] = toSnakeCase(fieldName);
			}
		}
	}

	// 型安全な結果構築
	const result: RequiredColumns & Record<string, string> = {
		...requiredColumns,
		...metadataColumns,
	};

	// この時点で、resultはColumnMapping<TMetadata>と構造的に互換性がある
	// TypeScriptが正確に推論できないため、型アサーションを使用するが、
	// 実行時の安全性は上記の段階的な構築により保証されている
	return result as ColumnMapping<TMetadata>;
}

/**
 * デフォルトのembedder作成関数
 */
export function createDefaultEmbedder() {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error("OPENAI_API_KEY environment variable is required");
	}
	return new OpenAIEmbedder({
		apiKey,
		model: "text-embedding-3-small",
	});
}

/**
 * デフォルトのchunker作成関数
 */
export function createDefaultChunker() {
	return new LineChunker({
		maxChunkSize: 1000,
		overlap: 200,
	});
}

/**
 * 簡素化されたIngestPipeline設定オプション（実用性重視版）
 */
export interface SimpleIngestConfig<
	TSourceMetadata extends Record<string, unknown>,
	TTargetMetadata extends Record<string, unknown> = TSourceMetadata,
> {
	/**
	 * ドキュメントローダー
	 */
	documentLoader: DocumentLoader<TSourceMetadata>;
	/**
	 * チャンクストア
	 */
	chunkStore: ChunkStore<TTargetMetadata>;
	/**
	 * メタデータ変換関数
	 * TSourceMetadata と TTargetMetadata が異なる型の場合は必須
	 * 同じ型の場合は省略可能
	 */
	metadataTransform?: (metadata: TSourceMetadata) => TTargetMetadata;
	/**
	 * パイプラインオプション
	 */
	options?: {
		batchSize?: number;
		onProgress?: (progress: {
			processedDocuments: number;
			totalDocuments: number;
			currentDocument?: string;
		}) => void;
	};
}

/**
 * 簡素化されたIngestPipeline作成関数
 * chunker や embedder の詳細を隠蔽し、デフォルト設定を使用
 */
export function createIngestPipeline<
	TSourceMetadata extends Record<string, unknown>,
	TTargetMetadata extends Record<string, unknown> = TSourceMetadata,
>(config: SimpleIngestConfig<TSourceMetadata, TTargetMetadata>) {
	const {
		documentLoader,
		chunkStore,
		metadataTransform,
		options = {},
	} = config;

	// デフォルトのembedderとchunkerを使用
	const embedder = createDefaultEmbedder();
	const chunker = createDefaultChunker();

	return new IngestPipeline({
		documentLoader,
		chunker,
		embedder,
		chunkStore,
		metadataTransform,
		options: {
			batchSize: options.batchSize || 50,
			onProgress: options.onProgress,
		},
	});
}

// Re-export factory functions
export { createChunkStore, createQueryService } from "./factories";
