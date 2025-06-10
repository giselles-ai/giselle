/**
 * RAG3 のデフォルト設定とユーティリティ
 */

import type { z } from "zod/v4";
import type { ColumnMapping, RequiredColumns } from "../database/types";

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
	metadataSchema?: z.ZodType<TMetadata> & { shape: z.ZodRawShape };
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
	 * 埋め込みモデル
	 */
	embedder: {
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
	metadataSchema?: z.ZodType<TMetadata> & { shape: z.ZodRawShape };
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
 * メタデータスキーマからColumnMappingを自動生成
 */
export function createColumnMapping<TMetadata extends Record<string, unknown>>(
	options: {
		metadataSchema?: z.ZodType<TMetadata> & { shape: z.ZodRawShape };
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

	// メタデータカラムを設定
	const metadataColumns: Record<string, string> = {};

	if (metadataSchema) {
		// ZodObjectの場合、フィールド名からカラム名を自動生成
		const shape = metadataSchema.shape;
		for (const fieldName of Object.keys(shape)) {
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

	// 型アサーションが必要: TypeScriptは Object.keys() の結果から
	// { [K in keyof TMetadata]: string } への正確な型関係を推論できない
	// ただし、ランタイムでは requiredColumns + metadataColumns が
	// ColumnMapping<TMetadata> と等価であることが保証されている
	return {
		...requiredColumns,
		...metadataColumns,
	} as ColumnMapping<TMetadata>;
}

// Re-export factory functions
export { createChunkStore, createQueryService } from "./factories";
