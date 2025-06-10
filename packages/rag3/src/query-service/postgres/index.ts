import * as pgvector from "pgvector/pg";
import type { z } from "zod";
import { PoolManager } from "../../database/postgres";
import type { ColumnMapping, DatabaseConfig } from "../../database/types";
import type { Embedder } from "../../embedder/types";
import { DatabaseError, EmbeddingError, ValidationError } from "../../errors";
import type { QueryResult, QueryService } from "../types";

export type DistanceFunction = "cosine" | "euclidean" | "inner_product";

export interface PostgresQueryServiceConfig<TContext, TMetadata> {
	database: DatabaseConfig;
	tableName: string;
	embedder: Embedder;
	columnMapping: ColumnMapping<TMetadata>;
	// コンテキストからフィルタ条件への変換（非同期対応）
	contextToFilter: (
		context: TContext,
	) => Record<string, unknown> | Promise<Record<string, unknown>>;
	// 検索時の追加オプション
	searchOptions?: {
		distanceFunction?: DistanceFunction;
	};
	// メタデータの検証用Zodスキーマ（オプショナル）
	metadataSchema?: z.ZodType<TMetadata>;
}

export class PostgresQueryService<
	TContext,
	TMetadata extends Record<string, unknown> = Record<string, unknown>,
> implements QueryService<TContext, TMetadata>
{
	constructor(
		private config: PostgresQueryServiceConfig<TContext, TMetadata>,
	) {}

	async search(
		query: string,
		context: TContext,
		limit = 10,
	): Promise<QueryResult<TMetadata>[]> {
		const { database, tableName, embedder, columnMapping, contextToFilter } =
			this.config;
		const pool = PoolManager.getPool(database);

		// pgvectorの型を登録
		const client = await pool.connect();
		try {
			await pgvector.registerTypes(client);
		} finally {
			client.release();
		}

		try {
			// クエリの埋め込みを生成
			const queryEmbedding = await embedder.embed(query);

			// フィルタ条件を生成（非同期対応）
			const filters = await contextToFilter(context);

			// WHERE句を構築
			const whereConditions: string[] = [];
			const values: unknown[] = [pgvector.toSql(queryEmbedding)];
			let paramIndex = 2;

			for (const [column, value] of Object.entries(filters)) {
				if (typeof column === "string") {
					whereConditions.push(
						`${this.escapeIdentifier(column)} = $${paramIndex}`,
					);
					values.push(value);
					paramIndex++;
				}
			}

			// メタデータカラムを選択
			const metadataColumns = Object.entries(columnMapping)
				.filter(
					([key]) =>
						!["documentKey", "content", "index", "embedding"].includes(key),
				)
				.map(([metadataKey, dbColumn]) => ({
					metadataKey,
					dbColumn:
						typeof dbColumn === "string" ? this.escapeIdentifier(dbColumn) : "",
				}))
				.filter((item) => item.dbColumn !== "");

			// SQLクエリを構築
			const distanceFunction = this.getDistanceFunction();
			const sql = `
        SELECT
          ${this.escapeIdentifier(columnMapping.content)} as content,
          ${this.escapeIdentifier(columnMapping.index)} as index,
          ${metadataColumns.map(({ dbColumn, metadataKey }) => `${dbColumn} as "${metadataKey}"`).join(", ")}${metadataColumns.length > 0 ? "," : ""}
          1 - (${this.escapeIdentifier(columnMapping.embedding)} ${distanceFunction} $1) as similarity
        FROM ${this.escapeIdentifier(tableName)}
        ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""}
        ORDER BY ${this.escapeIdentifier(columnMapping.embedding)} ${distanceFunction} $1
        LIMIT ${limit}
      `;

			const result = await pool.query(sql, values);

			// 結果をマッピング
			return result.rows.map((row) => {
				const metadata = this.extractMetadata(row, metadataColumns);

				// メタデータの検証（スキーマが提供されている場合）
				const validatedMetadata = this.validateMetadata(metadata);

				return {
					chunk: {
						content: row.content,
						index: row.index,
					},
					similarity: row.similarity,
					metadata: validatedMetadata,
				};
			});
		} catch (error) {
			if (error instanceof EmbeddingError) {
				throw error;
			}
			if (error instanceof ValidationError) {
				throw error;
			}
			throw new DatabaseError(
				"Failed to execute vector search",
				error instanceof Error ? error : undefined,
			);
		}
	}

	private getDistanceFunction(): string {
		const { searchOptions } = this.config;
		switch (searchOptions?.distanceFunction) {
			case "euclidean":
				return "<->";
			case "inner_product":
				return "<#>";
			default:
				return "<=>";
		}
	}

	private extractMetadata(
		row: Record<string, unknown>,
		metadataColumns: Array<{ metadataKey: string; dbColumn: string }>,
	): TMetadata {
		return Object.fromEntries(
			metadataColumns.map(({ metadataKey }) => [metadataKey, row[metadataKey]]),
		) as TMetadata;
	}

	private validateMetadata(metadata: TMetadata): TMetadata {
		const { metadataSchema } = this.config;

		// スキーマが提供されていない場合はそのまま返す
		if (!metadataSchema) {
			return metadata;
		}

		// メタデータの検証
		const result = metadataSchema.safeParse(metadata);
		if (!result.success) {
			throw new ValidationError(
				"Invalid metadata retrieved from database",
				result.error.errors,
			);
		}

		return result.data;
	}

	private escapeIdentifier(identifier: string): string {
		return `"${identifier.replace(/"/g, '""')}"`;
	}
}
