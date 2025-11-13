import type { PoolClient } from "pg";
import { escapeIdentifier } from "pg";
import * as pgvector from "pgvector/pg";
import { EMBEDDING_COLUMNS } from "../../database/constants";
import { ConfigurationError } from "../../errors";
import { replaceNullCharacters } from "../../utils";
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

/**
 * Helper for building parameterized SQL queries
 * Automatically tracks parameter indices and builds the values array
 */
function createParamHelper() {
	const values: unknown[] = [];
	return {
		add(value: unknown): string {
			values.push(value);
			return `$${values.length}`;
		},
		values() {
			return values;
		},
	};
}

type ChunkRecord = {
	record: Record<string, unknown>;
	embedding: {
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
	const param = createParamHelper();
	const conditions: string[] = [];

	// Add conditions with automatic parameter tracking
	conditions.push(
		`${escapeIdentifier(documentKeyColumn)} = ${param.add(documentKey)}`,
	);
	conditions.push(
		`${EMBEDDING_COLUMNS.PROFILE_ID} = ${param.add(embeddingProfileId)}`,
	);
	conditions.push(
		`${EMBEDDING_COLUMNS.DIMENSIONS} = ${param.add(embeddingDimensions)}`,
	);

	// Add scope conditions (sorted for stability)
	const scopeKeys = Object.keys(scope).sort();
	for (const key of scopeKeys) {
		conditions.push(`${escapeIdentifier(key)} = ${param.add(scope[key])}`);
	}

	const query = `
        DELETE FROM ${escapeIdentifier(tableName)}
        WHERE ${conditions.join(" AND ")}
    `;

	await client.query(query, param.values());
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
			[columnMapping.chunkContent]: replaceNullCharacters(chunk.content),
			[columnMapping.chunkIndex]: chunk.index,
			...metadataColumns,
			...scope,
		},
		embedding: {
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
		EMBEDDING_COLUMNS.VECTOR,
		EMBEDDING_COLUMNS.PROFILE_ID,
		EMBEDDING_COLUMNS.DIMENSIONS,
	];

	const param = createParamHelper();
	const valuePlaceholders: string[] = [];

	// Build value placeholders for each record
	for (const item of records) {
		const placeholders = columns.map((column) => {
			if (column === EMBEDDING_COLUMNS.VECTOR) {
				return param.add(pgvector.toSql(item.embedding.embeddingValue));
			}
			if (column === EMBEDDING_COLUMNS.PROFILE_ID) {
				return param.add(item.embedding.embeddingProfileId);
			}
			if (column === EMBEDDING_COLUMNS.DIMENSIONS) {
				return param.add(item.embedding.embeddingDimensions);
			}
			return param.add(item.record[column]);
		});
		valuePlaceholders.push(`(${placeholders.join(", ")})`);
	}

	const query = `
		INSERT INTO ${escapeIdentifier(tableName)}
		(${columns.map((c) => escapeIdentifier(c)).join(", ")})
		VALUES ${valuePlaceholders.join(", ")}
	`;

	await client.query(query, param.values());
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

	const param = createParamHelper();
	const conditions: string[] = [];

	// Add conditions with automatic parameter tracking
	conditions.push(
		`${EMBEDDING_COLUMNS.PROFILE_ID} = ${param.add(embeddingProfileId)}`,
	);
	conditions.push(
		`${EMBEDDING_COLUMNS.DIMENSIONS} = ${param.add(embeddingDimensions)}`,
	);

	// Add scope conditions (sorted for stability)
	const scopeKeys = Object.keys(scope).sort();
	for (const key of scopeKeys) {
		conditions.push(`${escapeIdentifier(key)} = ${param.add(scope[key])}`);
	}

	// Add IN clause for document keys
	const inPlaceholders = documentKeys.map((key) => param.add(key)).join(", ");
	conditions.push(
		`${escapeIdentifier(documentKeyColumn)} IN (${inPlaceholders})`,
	);

	const query = `
        DELETE FROM ${escapeIdentifier(tableName)}
        WHERE ${conditions.join(" AND ")}
    `;

	await client.query(query, param.values());
}

/**
 * Get document versions for differential ingestion
 */
export async function queryDocumentVersions(
	client: PoolClient,
	tableName: string,
	documentKeyColumn: string,
	versionColumn: string,
	metadataVersionColumn: string | undefined,
	scope: Record<string, unknown>,
	embeddingProfileId: number,
	embeddingDimensions: number,
): Promise<
	Array<{
		documentKey: string;
		version: string;
		metadataVersion?: string;
	}>
> {
	const param = createParamHelper();
	const conditions: string[] = [];

	// Add conditions with automatic parameter tracking
	conditions.push(
		`${EMBEDDING_COLUMNS.PROFILE_ID} = ${param.add(embeddingProfileId)}`,
	);
	conditions.push(
		`${EMBEDDING_COLUMNS.DIMENSIONS} = ${param.add(embeddingDimensions)}`,
	);

	// Add scope conditions (sorted for stability)
	const scopeKeys = Object.keys(scope).sort();
	for (const key of scopeKeys) {
		conditions.push(`${escapeIdentifier(key)} = ${param.add(scope[key])}`);
	}

	// Add version not null condition
	conditions.push(`${escapeIdentifier(versionColumn)} IS NOT NULL`);

	// Build SELECT columns dynamically
	const selectColumns = [
		`${escapeIdentifier(documentKeyColumn)} as document_key`,
		`${escapeIdentifier(versionColumn)} as version`,
	];

	if (metadataVersionColumn) {
		selectColumns.push(
			`${escapeIdentifier(metadataVersionColumn)} as metadata_version`,
		);
	}

	const query = `
        SELECT DISTINCT
            ${selectColumns.join(",\n            ")}
        FROM ${escapeIdentifier(tableName)}
        WHERE ${conditions.join(" AND ")}
    `;

	const result = await client.query<{
		document_key: unknown;
		version: unknown;
		metadata_version?: unknown;
	}>(query, param.values());
	return result.rows.map((row) => {
		return {
			documentKey: toColumnString(row.document_key, "documentKey"),
			version: toColumnString(row.version, "version"),
			metadataVersion: row.metadata_version
				? toColumnString(row.metadata_version, "metadataVersion")
				: undefined,
		};
	});
}

/**
 * Update metadata fields without re-embedding
 */
export async function updateMetadataFields(
	client: PoolClient,
	tableName: string,
	documentKey: string,
	documentKeyColumn: string,
	metadata: Record<string, unknown>,
	columnMapping: Record<string, string>,
	scope: Record<string, unknown>,
	embeddingProfileId: number,
	embeddingDimensions: number,
): Promise<void> {
	const param = createParamHelper();

	// Build SET expressions
	const setExpressions: string[] = [];

	for (const [metadataKey, value] of Object.entries(metadata)) {
		const columnName = columnMapping[metadataKey];
		if (!columnName) {
			continue; // Skip fields without mapping
		}
		setExpressions.push(
			`${escapeIdentifier(columnName)} = ${param.add(value)}`,
		);
	}

	// Build WHERE conditions
	const conditions: string[] = [];
	conditions.push(
		`${escapeIdentifier(documentKeyColumn)} = ${param.add(documentKey)}`,
	);
	conditions.push(
		`${EMBEDDING_COLUMNS.PROFILE_ID} = ${param.add(embeddingProfileId)}`,
	);
	conditions.push(
		`${EMBEDDING_COLUMNS.DIMENSIONS} = ${param.add(embeddingDimensions)}`,
	);

	const scopeKeys = Object.keys(scope).sort();
	for (const key of scopeKeys) {
		conditions.push(`${escapeIdentifier(key)} = ${param.add(scope[key])}`);
	}

	const query = `
        UPDATE ${escapeIdentifier(tableName)}
        SET ${setExpressions.join(", ")}
        WHERE ${conditions.join(" AND ")}
    `;

	await client.query(query, param.values());
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
