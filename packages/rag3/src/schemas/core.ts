import { z } from "zod/v4";

/**
 * RAG システムの基本的な型のためのZodスキーマ
 */

// チャンクの基本スキーマ
export const ChunkSchema = z.object({
	content: z.string(),
	index: z.number().int().nonnegative(),
});

export type ChunkZod = z.infer<typeof ChunkSchema>;

// 埋め込み付きチャンクのスキーマ
export const ChunkWithEmbeddingSchema = ChunkSchema.extend({
	embedding: z.array(z.number()).min(1), // 少なくとも1次元のベクトル
});

export type ChunkWithEmbeddingZod = z.infer<typeof ChunkWithEmbeddingSchema>;

// ドキュメントのスキーマファクトリー関数
export const createDocumentSchema = <T extends z.ZodType>(
	metadataSchema: T,
) => {
	return z.object({
		content: z.string(),
		metadata: metadataSchema,
		documentKey: z.string().min(1), // 空文字列を防ぐ
	});
};

// データベース設定のスキーマ
export const DatabaseConfigSchema = z.object({
	connectionString: z.string().min(1),
	poolConfig: z
		.object({
			max: z.number().int().positive().optional(),
			idleTimeoutMillis: z.number().int().positive().optional(),
			connectionTimeoutMillis: z.number().int().positive().optional(),
		})
		.optional(),
});

export type DatabaseConfigZod = z.infer<typeof DatabaseConfigSchema>;

// 必須カラムのスキーマ
export const RequiredColumnsSchema = z.object({
	documentKey: z.string().min(1),
	content: z.string().min(1),
	index: z.string().min(1),
	embedding: z.string().min(1),
});

export type RequiredColumnsZod = z.infer<typeof RequiredColumnsSchema>;

// カラムマッピングのスキーマファクトリー関数
export const createColumnMappingSchema = <
	TSchema extends z.ZodObject<z.ZodRawShape>,
>(
	metadataSchema: TSchema,
) => {
	// メタデータスキーマからキーを取得
	const metadataKeys = Object.keys(metadataSchema.shape);

	// 必須カラムを含む完全なスキーマを構築
	const baseSchema = RequiredColumnsSchema;

	// メタデータカラムのマッピングを追加
	if (metadataKeys.length > 0) {
		// 少なくとも1つのキーがある場合のみenumを作成
		const metadataMapping = z.record(
			z.enum(metadataKeys as [string, ...string[]]),
			z.string().min(1),
		);
		return baseSchema.and(metadataMapping);
	}

	// メタデータがない場合は必須カラムのみ
	return baseSchema;
};

// クエリ結果のスキーマファクトリー関数
export const createQueryResultSchema = <T extends z.ZodType>(
	metadataSchema: T,
) => {
	return z.object({
		chunk: ChunkSchema,
		similarity: z.number().min(0).max(1), // 0-1の範囲の類似度スコア
		metadata: metadataSchema,
	});
};
