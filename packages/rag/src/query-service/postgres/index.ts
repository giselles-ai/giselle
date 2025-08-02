import type { TelemetrySettings } from "ai";
import { escapeIdentifier } from "pg";
import * as pgvector from "pgvector/pg";
import type { z } from "zod/v4";
import { PoolManager } from "../../database/postgres";
import { ensurePgVectorTypes } from "../../database/postgres/pgvector-registry";
import type { DatabaseConfig } from "../../database/types";
import type { EmbedderFunction } from "../../embedder";
import { createDefaultEmbedder } from "../../embedder";
import {
	ConfigurationError,
	DatabaseError,
	EmbeddingError,
	ValidationError,
} from "../../errors";
import type { RequiredColumns } from "../column-mapping";
import { createColumnMapping, REQUIRED_COLUMN_KEYS } from "../column-mapping";
import type { QueryResult } from "../types";

function parseMetadata<TMetadata extends Record<string, unknown>>(
	row: Record<string, unknown>,
	metadataColumns: Array<{ metadataKey: string; dbColumn: string }>,
	metadataSchema: z.ZodType<TMetadata>,
): TMetadata {
	const rawMetadata = Object.fromEntries(
		metadataColumns.map(({ metadataKey }) => [metadataKey, row[metadataKey]]),
	);

	const result = metadataSchema.safeParse(rawMetadata);
	if (!result.success) {
		throw ValidationError.fromZodError(result.error, {
			operation: "parseMetadata",
			source: "database",
			metadata: rawMetadata,
		});
	}

	return result.data;
}

function validatePoolConfig(poolConfig: {
	max?: number;
	idleTimeoutMillis?: number;
	connectionTimeoutMillis?: number;
}) {
	const { max, idleTimeoutMillis, connectionTimeoutMillis } = poolConfig;

	if (max !== undefined && (max < 0 || max > 100)) {
		throw new ValidationError(`Pool max must be between 0 and 100, got ${max}`);
	}

	if (idleTimeoutMillis !== undefined && idleTimeoutMillis < 0) {
		throw new ValidationError(
			`Pool idle timeout must be non-negative, got ${idleTimeoutMillis}`,
		);
	}

	if (connectionTimeoutMillis !== undefined && connectionTimeoutMillis < 0) {
		throw new ValidationError(
			`Pool connection timeout must be non-negative, got ${connectionTimeoutMillis}`,
		);
	}
}

function validateDatabase(database: DatabaseConfig) {
	if (!database.connectionString) {
		throw new ValidationError("Connection string is required");
	}

	if (database.poolConfig) {
		validatePoolConfig(database.poolConfig);
	}

	return database;
}

export function createPostgresQueryService<
	TContext,
	TSchema extends z.ZodType<Record<string, unknown>>,
>(config: {
	database: DatabaseConfig;
	tableName: string;
	embedder?: EmbedderFunction;
	requiredColumnOverrides?: Partial<RequiredColumns>;
	metadataColumnOverrides?: Partial<Record<keyof z.infer<TSchema>, string>>;
	contextToFilter: (
		context: TContext,
	) => Record<string, unknown> | Promise<Record<string, unknown>>;
	metadataSchema: TSchema;
}) {
	const database = validateDatabase(config.database);
	const columnMapping = createColumnMapping({
		metadataSchema: config.metadataSchema,
		requiredColumnOverrides: config.requiredColumnOverrides,
		metadataColumnOverrides: config.metadataColumnOverrides,
	});

	async function search(
		query: string,
		context: TContext,
		limit = 10,
		similarityThreshold?: number,
		telemetry?: TelemetrySettings,
	): Promise<QueryResult<z.infer<TSchema>>[]> {
		const pool = PoolManager.getPool(database);

		const client = await pool.connect();
		try {
			await ensurePgVectorTypes(client, database.connectionString);
		} finally {
			client.release();
		}

		try {
			const embedder = config.embedder || createDefaultEmbedder(telemetry);
			const queryEmbedding = await embedder.embed(query);
			const filters = await config.contextToFilter(context);

			const { sql, values } = buildSearchQuery({
				tableName: config.tableName,
				columnMapping,
				queryEmbedding,
				filters,
				limit,
				similarityThreshold,
			});

			const result = await pool.query(sql, values);
			return result.rows.map((row) =>
				mapRowToResult(row, columnMapping, config.metadataSchema),
			);
		} catch (error) {
			if (error instanceof EmbeddingError || error instanceof ValidationError) {
				throw error;
			}
			throw DatabaseError.queryFailed(
				"vector search query",
				error instanceof Error ? error : undefined,
			);
		}
	}

	return { search };
}

function buildSearchQuery({
	tableName,
	columnMapping,
	queryEmbedding,
	filters,
	limit,
	similarityThreshold,
}: {
	tableName: string;
	columnMapping: ReturnType<typeof createColumnMapping>;
	queryEmbedding: number[];
	filters: Record<string, unknown>;
	limit: number;
	similarityThreshold?: number;
}) {
	const values: unknown[] = [pgvector.toSql(queryEmbedding)];
	const whereConditions: string[] = [];
	let paramIndex = 2;

	for (const [column, value] of Object.entries(filters)) {
		whereConditions.push(`${escapeIdentifier(column)} = $${paramIndex}`);
		values.push(value);
		paramIndex++;
	}

	if (similarityThreshold !== undefined && similarityThreshold > 0) {
		whereConditions.push(
			`1 - (${escapeIdentifier(columnMapping.embedding)} <=> $1) >= $${paramIndex}`,
		);
		values.push(similarityThreshold);
		paramIndex++;
	}

	const metadataColumns = getMetadataColumns(columnMapping);
	const metadataSelects = metadataColumns
		.map(
			({ dbColumn, metadataKey }) =>
				`${dbColumn} as ${escapeIdentifier(metadataKey)}`,
		)
		.join(", ");

	const sql = `
		SELECT
			${escapeIdentifier(columnMapping.chunkContent)} as content,
			${escapeIdentifier(columnMapping.chunkIndex)} as index,
			${metadataSelects}${metadataColumns.length > 0 ? "," : ""}
			1 - (${escapeIdentifier(columnMapping.embedding)} <=> $1) as similarity
		FROM ${escapeIdentifier(tableName)}
		${whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""}
		ORDER BY ${escapeIdentifier(columnMapping.embedding)} <=> $1
		LIMIT $${paramIndex}
	`;

	values.push(limit);
	return { sql, values };
}

function getMetadataColumns(
	columnMapping: ReturnType<typeof createColumnMapping>,
) {
	const requiredKeys = new Set(REQUIRED_COLUMN_KEYS);
	return Object.entries(columnMapping as Record<string, string>)
		.filter(
			([key]) =>
				!requiredKeys.has(key as (typeof REQUIRED_COLUMN_KEYS)[number]),
		)
		.map(([metadataKey, dbColumn]) => {
			if (typeof dbColumn !== "string") {
				throw ConfigurationError.invalidValue(
					`columnMapping.${metadataKey}`,
					dbColumn,
					"string",
				);
			}
			return {
				metadataKey,
				dbColumn: escapeIdentifier(dbColumn),
			};
		});
}

function mapRowToResult<TSchema extends z.ZodType<Record<string, unknown>>>(
	row: Record<string, unknown>,
	columnMapping: ReturnType<typeof createColumnMapping>,
	metadataSchema: TSchema,
): QueryResult<z.infer<TSchema>> {
	const metadataColumns = getMetadataColumns(columnMapping);
	const metadata = parseMetadata(row, metadataColumns, metadataSchema);

	return {
		chunk: {
			content: row.content,
			index: row.index,
		},
		similarity: row.similarity,
		metadata,
	} as QueryResult<z.infer<TSchema>>;
}
