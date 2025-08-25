import {
	EMBEDDING_PROFILES,
	type EmbeddingProfileId,
} from "@giselle-sdk/data-type";
import type { TelemetrySettings } from "ai";
import { escapeIdentifier } from "pg";
import * as pgvector from "pgvector/pg";
import type { z } from "zod/v4";
import { PoolManager } from "../../database/postgres";
import { ensurePgVectorTypes } from "../../database/postgres/pgvector-registry";
import type { DatabaseConfig } from "../../database/types";
import { createEmbedderFromProfile } from "../../embedder/profiles";
import {
	ConfigurationError,
	DatabaseError,
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
	contextToEmbeddingProfileId: (context: TContext) => EmbeddingProfileId;
	requiredColumnOverrides?: Partial<RequiredColumns>;
	metadataColumnOverrides?: Partial<Record<keyof z.infer<TSchema>, string>>;
	contextToFilter: (
		context: TContext,
	) => Record<string, unknown> | Promise<Record<string, unknown>>;
	metadataSchema: TSchema;
	additionalResolver?: (
		results: QueryResult<z.infer<TSchema>>[],
		context: TContext,
	) => Promise<QueryResult<z.infer<TSchema>>[]>;
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
			const profileId = config.contextToEmbeddingProfileId(context);
			const profile = EMBEDDING_PROFILES[profileId];
			if (!profile) {
				throw new ConfigurationError(
					`Invalid embedding profile ID: ${profileId}. Valid IDs are: ${Object.keys(EMBEDDING_PROFILES).join(", ")}`,
				);
			}

			const apiKey =
				process.env[
					profile.provider === "openai" ? "OPENAI_API_KEY" : "GOOGLE_API_KEY"
				];
			if (!apiKey) {
				throw new ConfigurationError(
					`No API key found for embedding profile ${profileId}`,
				);
			}

			const embedder = createEmbedderFromProfile(profileId, apiKey, {
				telemetry,
			});
			const queryEmbedding = await embedder.embed(query);

			const filters = await config.contextToFilter(context);

			const { sql, values } = buildSearchQuery({
				tableName: config.tableName,
				columnMapping,
				queryEmbedding,
				filters,
				embeddingProfileId: profileId,
				embeddingDimensions: profile.dimensions,
				limit,
				similarityThreshold,
			});

			const result = await pool.query(sql, values);
			const mappedResults = result.rows.map((row) =>
				mapRowToResult(row, columnMapping, config.metadataSchema),
			);

			// Apply additional resolver if provided
			if (config.additionalResolver) {
				return await config.additionalResolver(mappedResults, context);
			}

			return mappedResults;
		} catch (error) {
			if (error instanceof ValidationError) {
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
	embeddingProfileId,
	embeddingDimensions,
	limit,
	similarityThreshold,
}: {
	tableName: string;
	columnMapping: ReturnType<typeof createColumnMapping>;
	queryEmbedding: number[];
	filters: Record<string, unknown>;
	embeddingProfileId: number;
	embeddingDimensions: number;
	limit: number;
	similarityThreshold?: number;
}) {
	const values: unknown[] = [pgvector.toSql(queryEmbedding)];
	const whereConditions: string[] = [];
	let paramIndex = 2;

	// Determine the appropriate cast based on embedding dimensions
	const embeddingCast =
		embeddingDimensions === 3072
			? `${escapeIdentifier(columnMapping.embedding)}::halfvec(3072)`
			: `${escapeIdentifier(columnMapping.embedding)}::vector(1536)`;

	// Add embedding profile conditions
	whereConditions.push(`embedding_profile_id = $${paramIndex}`);
	values.push(embeddingProfileId);
	paramIndex++;

	whereConditions.push(`embedding_dimensions = $${paramIndex}`);
	values.push(embeddingDimensions);
	paramIndex++;

	// Add user-provided filters
	for (const [column, value] of Object.entries(filters)) {
		whereConditions.push(`${escapeIdentifier(column)} = $${paramIndex}`);
		values.push(value);
		paramIndex++;
	}

	if (similarityThreshold !== undefined && similarityThreshold > 0) {
		whereConditions.push(`1 - (${embeddingCast} <=> $1) >= $${paramIndex}`);
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
			1 - (${embeddingCast} <=> $1) as similarity
		FROM ${escapeIdentifier(tableName)}
		${whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""}
		ORDER BY ${embeddingCast} <=> $1
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
