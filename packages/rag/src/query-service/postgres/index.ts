import { escapeIdentifier } from "pg";
import * as pgvector from "pgvector/pg";
import type { z } from "zod/v4";
import { createColumnMapping } from "../../database";
import { PoolManager } from "../../database/postgres";
import { ensurePgVectorTypes } from "../../database/postgres/pgvector-registry";
import type {
	ColumnMapping,
	DatabaseConfig,
	RequiredColumns,
} from "../../database/types";
import type { EmbedderFunction } from "../../embedder";
import { createDefaultEmbedder } from "../../embedder";
import {
	ConfigurationError,
	DatabaseError,
	EmbeddingError,
	ValidationError,
} from "../../errors";
import type { QueryResult } from "../types";

/**
 * Extract metadata from database row
 */
function extractMetadata<TMetadata extends Record<string, unknown>>(
	row: Record<string, unknown>,
	metadataColumns: Array<{ metadataKey: string; dbColumn: string }>,
	metadataSchema: z.ZodType<TMetadata>,
): TMetadata {
	const rawMetadata = Object.fromEntries(
		metadataColumns.map(({ metadataKey }) => [metadataKey, row[metadataKey]]),
	);
	return validateMetadata(rawMetadata, metadataSchema);
}

function validateMetadata<TMetadata>(
	metadata: unknown,
	metadataSchema: z.ZodType<TMetadata>,
): TMetadata {
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

function validateDatabaseConfig(database: {
	connectionString: string;
	poolConfig?: {
		max?: number;
		idleTimeoutMillis?: number;
		connectionTimeoutMillis?: number;
	};
}) {
	if (!database.connectionString || database.connectionString.length === 0) {
		throw new ValidationError("Connection string is required", undefined, {
			operation: "validateDatabaseConfig",
			field: "connectionString",
		});
	}

	if (database.poolConfig) {
		if (database.poolConfig.max !== undefined && database.poolConfig.max < 0) {
			throw new ValidationError("Pool max must be non-negative", undefined, {
				operation: "validateDatabaseConfig",
				field: "poolConfig.max",
			});
		}
		if (
			database.poolConfig.max !== undefined &&
			database.poolConfig.max > 100
		) {
			throw new ValidationError("Pool max must be 100 or less", undefined, {
				operation: "validateDatabaseConfig",
				field: "poolConfig.max",
			});
		}
		if (
			database.poolConfig.idleTimeoutMillis !== undefined &&
			database.poolConfig.idleTimeoutMillis < 0
		) {
			throw new ValidationError(
				"Pool idle timeout must be non-negative",
				undefined,
				{
					operation: "validateDatabaseConfig",
					field: "poolConfig.idleTimeoutMillis",
				},
			);
		}
		if (
			database.poolConfig.connectionTimeoutMillis !== undefined &&
			database.poolConfig.connectionTimeoutMillis < 0
		) {
			throw new ValidationError(
				"Pool connection timeout must be non-negative",
				undefined,
				{
					operation: "validateDatabaseConfig",
					field: "poolConfig.connectionTimeoutMillis",
				},
			);
		}
	}

	return database;
}

/**
 * Create a PostgreSQL query service
 */
export function createPostgresQueryService<
	TContext,
	TSchema extends z.ZodType<Record<string, unknown>>,
>(config: {
	database: DatabaseConfig;
	tableName: string;
	embedder?: EmbedderFunction;
	columnMapping?: ColumnMapping<z.infer<TSchema>>;
	requiredColumnOverrides?: Partial<RequiredColumns>;
	metadataColumnOverrides?: Partial<Record<keyof z.infer<TSchema>, string>>;
	contextToFilter: (
		context: TContext,
	) => Record<string, unknown> | Promise<Record<string, unknown>>;
	metadataSchema: TSchema;
}) {
	// Validate database config
	const database = validateDatabaseConfig(config.database);

	// Resolve embedder
	const embedder = config.embedder || createDefaultEmbedder();

	// Resolve column mapping
	const columnMapping =
		config.columnMapping ||
		createColumnMapping({
			metadataSchema: config.metadataSchema,
			requiredColumnOverrides: config.requiredColumnOverrides,
			metadataColumnOverrides: config.metadataColumnOverrides,
		});

	const search = async (
		query: string,
		context: TContext,
		limit = 10,
	): Promise<QueryResult<z.infer<TSchema>>[]> => {
		const { tableName, contextToFilter, metadataSchema } = config;
		const pool = PoolManager.getPool(database);

		// register pgvector types using singleton registry
		const client = await pool.connect();
		try {
			await ensurePgVectorTypes(client, database.connectionString);
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
				whereConditions.push(`${escapeIdentifier(column)} = $${paramIndex}`);
				values.push(value);
				paramIndex++;
			}

			const metadataColumns = Object.entries(columnMapping)
				.filter(
					([key]) =>
						!["documentKey", "content", "index", "embedding"].includes(key),
				)
				.map(([metadataKey, dbColumn]) => {
					if (typeof dbColumn !== "string") {
						throw ConfigurationError.invalidValue(
							`columnMapping.${metadataKey}`,
							dbColumn,
							"string",
							{
								operation: "validateColumnMapping",
								metadataKey,
							},
						);
					}
					return {
						metadataKey,
						dbColumn: escapeIdentifier(dbColumn),
					};
				});

			const sql = `
        SELECT
          ${escapeIdentifier(columnMapping.chunkContent)} as content,
          ${escapeIdentifier(columnMapping.chunkIndex)} as index,
          ${metadataColumns
						.map(
							({ dbColumn, metadataKey }) =>
								`${dbColumn} as ${escapeIdentifier(metadataKey)}`,
						)
						.join(", ")}${metadataColumns.length > 0 ? "," : ""}
          1 - (${escapeIdentifier(columnMapping.embedding)} <=> $1) as similarity
        FROM ${escapeIdentifier(tableName)}
        ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""}
        ORDER BY ${escapeIdentifier(columnMapping.embedding)} <=> $1
        LIMIT $${paramIndex}
      `;

			values.push(limit);
			const result = await pool.query(sql, values);

			return result.rows.map((row) => {
				const metadata = extractMetadata(row, metadataColumns, metadataSchema);

				return {
					chunk: {
						content: row.content,
						index: row.index,
					},
					similarity: row.similarity,
					metadata,
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
	};

	return {
		search,
	};
}
