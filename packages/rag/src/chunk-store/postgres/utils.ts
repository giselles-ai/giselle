import type { PoolClient } from "pg";
import { escapeIdentifier } from "pg";
import * as pgvector from "pgvector/pg";
import { ConfigurationError } from "../../errors";
import type { ColumnMapping } from "../column-mapping";
import { REQUIRED_COLUMN_KEYS } from "../column-mapping";
import type { ChunkWithEmbedding } from "../types";

const PERFORMANCE_CONSTANTS = {
	/**
	 * Maximum number of records to insert in a single batch
	 * Limited by PostgreSQL parameter limit (typically 65535)
	 * With ~10 columns per record, this allows safe batching
	 */
	MAX_BATCH_SIZE: 5000,
} as const;

type ChunkRecord = {
	record: Record<string, unknown>;
	embedding: {
		embeddingColumn: string;
		embeddingValue: number[];
		embeddingProfileId: number;
		embeddingDimensions: number;
	};
};

/**
 * Map metadata to column names
 */
export function mapMetadataToColumns<TMetadata extends Record<string, unknown>>(
	metadata: TMetadata,
	columnMapping: ColumnMapping<TMetadata>,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(metadata)) {
		if (
			key in columnMapping &&
			!REQUIRED_COLUMN_KEYS.includes(
				key as (typeof REQUIRED_COLUMN_KEYS)[number],
			)
		) {
			const columnName = columnMapping[key as keyof typeof columnMapping];
			result[columnName] = value;
		}
	}

	return result;
}

/**
 * Build scope conditions for WHERE clause
 */
function buildScopeConditions(
	scope: Record<string, unknown>,
	startParamIndex = 1,
): { conditions: string; values: unknown[] } {
	const conditions = Object.entries(scope)
		.map(
			([key, _], index) =>
				`${escapeIdentifier(key)} = $${startParamIndex + index}`,
		)
		.join(" AND ");
	const values = Object.values(scope);
	return { conditions, values };
}

/**
 * Delete chunks by document key
 */
export async function deleteChunksByDocumentKey(
	client: PoolClient,
	tableName: string,
	documentKey: string,
	documentKeyColumn: string,
	scope: Record<string, unknown>,
	embeddingProfileId: number,
	embeddingDimensions: number,
): Promise<void> {
	const { conditions: scopeConditions, values: scopeValues } =
		buildScopeConditions(scope, 4);

	let query = `
		DELETE FROM ${escapeIdentifier(tableName)}
		WHERE ${escapeIdentifier(documentKeyColumn)} = $1
			AND embedding_profile_id = $2
			AND embedding_dimensions = $3
	`;

	if (scopeConditions) {
		query += ` AND ${scopeConditions}`;
	}

	await client.query(query, [
		documentKey,
		embeddingProfileId,
		embeddingDimensions,
		...scopeValues,
	]);
}

/**
 * Prepare chunk records for insertion
 */
export function prepareChunkRecords<TMetadata extends Record<string, unknown>>(
	documentKey: string,
	chunks: ChunkWithEmbedding[],
	metadata: TMetadata,
	columnMapping: ColumnMapping<TMetadata>,
	scope: Record<string, unknown>,
	embeddingProfileId: number,
	embeddingDimensions: number,
): ChunkRecord[] {
	const metadataColumns = mapMetadataToColumns(metadata, columnMapping);

	return chunks.map((chunk) => ({
		record: {
			[columnMapping.documentKey]: documentKey,
			[columnMapping.chunkContent]: chunk.content,
			[columnMapping.chunkIndex]: chunk.index,
			...metadataColumns,
			...scope,
		},
		embedding: {
			embeddingColumn: columnMapping.embedding,
			embeddingValue: chunk.embedding,
			embeddingProfileId,
			embeddingDimensions,
		},
	}));
}

/**
 * Insert a single batch of records
 */
async function insertRecordsBatch(
	client: PoolClient,
	tableName: string,
	records: ChunkRecord[],
): Promise<void> {
	if (records.length === 0) {
		return;
	}

	// Get column names from the first record
	const firstRecord = records[0];
	const columns = [
		...Object.keys(firstRecord.record),
		firstRecord.embedding.embeddingColumn,
		"embedding_profile_id",
		"embedding_dimensions",
	];
	const allValues: unknown[] = [];
	const valuePlaceholders: string[] = [];

	records.forEach((item, recordIndex) => {
		const recordValues = columns.map((c) => {
			if (c === item.embedding.embeddingColumn) {
				return pgvector.toSql(item.embedding.embeddingValue);
			}
			if (c === "embedding_profile_id") {
				return item.embedding.embeddingProfileId;
			}
			if (c === "embedding_dimensions") {
				return item.embedding.embeddingDimensions;
			}
			return item.record[c];
		});
		allValues.push(...recordValues);

		const startIndex = recordIndex * columns.length;
		const placeholders = columns.map(
			(_, colIndex) => `$${startIndex + colIndex + 1}`,
		);
		valuePlaceholders.push(`(${placeholders.join(", ")})`);
	});

	const query = `
		INSERT INTO ${escapeIdentifier(tableName)}
		(${columns.map((c) => escapeIdentifier(c)).join(", ")})
		VALUES ${valuePlaceholders.join(", ")}
	`;

	await client.query(query, allValues);
}

/**
 * Insert chunk records with batching
 */
export async function insertChunkRecords(
	client: PoolClient,
	tableName: string,
	records: ChunkRecord[],
): Promise<void> {
	// Process in batches if records exceed safe limit
	if (records.length > PERFORMANCE_CONSTANTS.MAX_BATCH_SIZE) {
		for (
			let i = 0;
			i < records.length;
			i += PERFORMANCE_CONSTANTS.MAX_BATCH_SIZE
		) {
			const batch = records.slice(i, i + PERFORMANCE_CONSTANTS.MAX_BATCH_SIZE);
			await insertRecordsBatch(client, tableName, batch);
		}
		return;
	}

	// Single batch insert for smaller datasets
	await insertRecordsBatch(client, tableName, records);
}

/**
 * Delete chunks by multiple document keys
 */
export async function deleteChunksByDocumentKeys(
	client: PoolClient,
	tableName: string,
	documentKeys: string[],
	documentKeyColumn: string,
	scope: Record<string, unknown>,
	embeddingProfileId: number,
	embeddingDimensions: number,
): Promise<void> {
	if (documentKeys.length === 0) {
		return;
	}

	const { conditions: scopeConditions, values: scopeValues } =
		buildScopeConditions(scope, 3);

	const allValues = [
		embeddingProfileId,
		embeddingDimensions,
		...scopeValues,
		...documentKeys,
	];
	const documentKeyStartIndex = 2 + scopeValues.length + 1;
	const documentKeyPlaceholders = documentKeys
		.map((_, index) => `$${documentKeyStartIndex + index}`)
		.join(", ");

	let query = `
		DELETE FROM ${escapeIdentifier(tableName)}
		WHERE embedding_profile_id = $1
			AND embedding_dimensions = $2
	`;

	if (scopeConditions) {
		query += ` AND ${scopeConditions}`;
	}

	query += ` AND ${escapeIdentifier(documentKeyColumn)} IN (${documentKeyPlaceholders})`;

	await client.query(query, allValues);
}

/**
 * Get document versions for differential ingestion
 */
export async function queryDocumentVersions(
	client: PoolClient,
	tableName: string,
	documentKeyColumn: string,
	versionColumn: string,
	scope: Record<string, unknown>,
	embeddingProfileId: number,
	embeddingDimensions: number,
): Promise<
	Array<{
		documentKey: string;
		version: string;
	}>
> {
	const { conditions: scopeConditions, values: scopeValues } =
		buildScopeConditions(scope, 3);

	let query = `
		SELECT DISTINCT
			${escapeIdentifier(documentKeyColumn)} as document_key,
			${escapeIdentifier(versionColumn)} as version
		FROM ${escapeIdentifier(tableName)}
		WHERE embedding_profile_id = $1
			AND embedding_dimensions = $2
	`;

	if (scopeConditions) {
		query += ` AND ${scopeConditions}`;
	}

	query += ` AND ${escapeIdentifier(versionColumn)} IS NOT NULL`;

	const result = await client.query<{
		document_key: unknown;
		version: unknown;
	}>(query, [embeddingProfileId, embeddingDimensions, ...scopeValues]);
	return result.rows.map((row) => {
		return {
			documentKey: toColumnString(row.document_key, "documentKey"),
			version: toColumnString(row.version, "version"),
		};
	});
}

/**
 * Convert various types to string for database columns
 */
function toColumnString(v: unknown, columnName: string): string {
	if (v == null) {
		throw new ConfigurationError(
			`${columnName} column value is null`,
			columnName,
			{ value: v },
		);
	}
	if (typeof v === "string") {
		return v;
	}
	if (
		typeof v === "number" ||
		typeof v === "bigint" ||
		typeof v === "boolean"
	) {
		return String(v);
	}
	if (v instanceof Date) {
		return v.toISOString();
	}
	if (Array.isArray(v)) {
		throw new ConfigurationError(
			`${columnName} column has unsupported type: array. Expected string, number, boolean, or Date`,
			columnName,
			{ value: v, type: "array" },
		);
	}
	if (typeof v === "object") {
		throw new ConfigurationError(
			`${columnName} column has unsupported type: object. Expected string, number, boolean, or Date`,
			columnName,
			{ value: v, type: "object" },
		);
	}

	throw new ConfigurationError(
		`${columnName} column has unsupported type: ${typeof v}. Expected string, number, boolean, or Date`,
		columnName,
		{ value: v, type: typeof v },
	);
}
