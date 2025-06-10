import * as pgvector from "pgvector/pg";
import type { z } from "zod/v4";
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
	// context to filter
	contextToFilter: (
		context: TContext,
	) => Record<string, unknown> | Promise<Record<string, unknown>>;
	// metadata schema
	metadataSchema: z.ZodType<TMetadata>;
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

		// register pgvector types
		const client = await pool.connect();
		try {
			await pgvector.registerTypes(client);
		} finally {
			client.release();
		}

		let filters: Record<string, unknown> = {};

		try {
			const queryEmbedding = await embedder.embed(query);

			filters = await contextToFilter(context);

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

			const sql = `
        SELECT
          ${this.escapeIdentifier(columnMapping.content)} as content,
          ${this.escapeIdentifier(columnMapping.index)} as index,
          ${metadataColumns.map(({ dbColumn, metadataKey }) => `${dbColumn} as "${metadataKey}"`).join(", ")}${metadataColumns.length > 0 ? "," : ""}
          1 - (${this.escapeIdentifier(columnMapping.embedding)} <=> $1) as similarity
        FROM ${this.escapeIdentifier(tableName)}
        ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""}
        ORDER BY ${this.escapeIdentifier(columnMapping.embedding)} <=> $1
        LIMIT ${limit}
      `;

			const result = await pool.query(sql, values);

			return result.rows.map((row) => {
				const metadata = this.extractMetadata(row, metadataColumns);

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
			throw DatabaseError.queryFailed(
				"vector search query",
				error instanceof Error ? error : undefined,
				{
					operation: "search",
					query,
					limit,
					tableName,
					contextFilters: JSON.stringify(filters),
				},
			);
		}
	}

	/**
	 * extract metadata from database row
	 */
	private extractMetadata(
		row: Record<string, unknown>,
		metadataColumns: Array<{ metadataKey: string; dbColumn: string }>,
	): TMetadata {
		// build raw metadata
		const rawMetadata = Object.fromEntries(
			metadataColumns.map(({ metadataKey }) => [metadataKey, row[metadataKey]]),
		);

		// type safe validation
		return this.validateMetadata(rawMetadata);
	}

	/**
	 * convert unknown data to TMetadata safely
	 */
	private validateMetadata(metadata: unknown): TMetadata {
		const { metadataSchema } = this.config;

		// if metadataSchema is not provided, perform more strict type check
		if (!metadataSchema) {
			if (this.isValidMetadataObject(metadata)) {
				return metadata;
			}
			throw new ValidationError(
				"Metadata validation failed: expected object with string keys",
				undefined,
				{ operation: "validateMetadata", metadata },
			);
		}

		// validate metadata
		const result = metadataSchema.safeParse(metadata);
		if (!result.success) {
			throw ValidationError.fromZodError(result.error, {
				operation: "validateMetadata",
				source: "database",
				metadata,
			});
		}

		return result.data;
	}

	/**
	 * type guard: check if metadata is valid object
	 */
	private isValidMetadataObject(metadata: unknown): metadata is TMetadata {
		// null check
		if (metadata === null || metadata === undefined) {
			return false;
		}

		// check if metadata is an object
		if (typeof metadata !== "object") {
			return false;
		}

		// exclude array
		if (Array.isArray(metadata)) {
			return false;
		}

		// check if metadata is a plain object
		// check if metadata is a plain object by checking the prototype chain
		try {
			return (
				Object.getPrototypeOf(metadata) === Object.prototype ||
				Object.getPrototypeOf(metadata) === null
			);
		} catch {
			return false;
		}
	}

	private escapeIdentifier(identifier: string): string {
		return `"${identifier.replace(/"/g, '""')}"`;
	}
}
