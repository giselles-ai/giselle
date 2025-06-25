import type { PoolClient } from "pg";
import { escapeIdentifier } from "pg";
import * as pgvector from "pgvector/pg";
import { type ColumnMapping, REQUIRED_COLUMN_KEYS } from "../../database/types";
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
 * Build delete query with optional static context
 */
export function buildDeleteQuery(
	tableName: string,
	documentKeyColumn: string,
	scope: Record<string, unknown>,
): { query: string; params: unknown[] } {
	let query = `
    DELETE FROM ${escapeIdentifier(tableName)}
    WHERE ${escapeIdentifier(documentKeyColumn)} = $1
  `;

	const params: unknown[] = [];

	for (const [key, value] of Object.entries(scope)) {
		params.push(value);
		query += ` AND ${escapeIdentifier(key)} = $${params.length + 1}`;
	}

	return { query, params };
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
): Promise<void> {
	const { query, params } = buildDeleteQuery(
		tableName,
		documentKeyColumn,
		scope,
	);
	await client.query(query, [documentKey, ...params]);
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
): Array<{
	record: Record<string, unknown>;
	embedding: {
		embeddingColumn: string;
		embeddingValue: number[];
	};
}> {
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
		},
	}));
}

/**
 * Insert a single batch of records
 */
async function insertRecordsBatch(
	client: PoolClient,
	tableName: string,
	records: Array<{
		record: Record<string, unknown>;
		embedding: {
			embeddingColumn: string;
			embeddingValue: number[];
		};
	}>,
): Promise<void> {
	if (records.length === 0) {
		return;
	}

	// Get column names from the first record
	const firstRecord = records[0];
	const columns = [
		...Object.keys(firstRecord.record),
		firstRecord.embedding.embeddingColumn,
	];
	const allValues: unknown[] = [];
	const valuePlaceholders: string[] = [];

	records.forEach((item, recordIndex) => {
		const recordValues = columns.map((c) =>
			c === item.embedding.embeddingColumn
				? pgvector.toSql(item.embedding.embeddingValue)
				: item.record[c],
		);
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
	records: Array<{
		record: Record<string, unknown>;
		embedding: {
			embeddingColumn: string;
			embeddingValue: number[];
		};
	}>,
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
): Promise<void> {
	if (documentKeys.length === 0) {
		return;
	}

	const scopeConditions = Object.entries(scope)
		.map(
			(_, index) =>
				`${escapeIdentifier(Object.keys(scope)[index])} = $${index + 1}`,
		)
		.join(" AND ");

	const scopeValueCount = Object.keys(scope).length;
	const documentKeyPlaceholders = documentKeys
		.map((_, index) => `$${scopeValueCount + index + 1}`)
		.join(", ");

	const query = `
		DELETE FROM ${escapeIdentifier(tableName)}
		WHERE ${scopeConditions}
			AND ${escapeIdentifier(documentKeyColumn)} IN (${documentKeyPlaceholders})
	`;

	const queryValues = [...Object.values(scope), ...documentKeys];
	await client.query(query, queryValues);
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
): Promise<
	Array<{
		documentKey: string;
		version: string;
	}>
> {
	const scopeConditions = Object.entries(scope)
		.map(([key, _], index) => `${escapeIdentifier(key)} = $${index + 1}`)
		.join(" AND ");

	const scopeValues = Object.values(scope);

	const query = `
		SELECT DISTINCT
			${escapeIdentifier(documentKeyColumn)} as document_key,
			${escapeIdentifier(versionColumn)} as version
		FROM ${escapeIdentifier(tableName)}
		WHERE ${scopeConditions}
			AND ${escapeIdentifier(versionColumn)} IS NOT NULL
	`;

	const result = await client.query(query, scopeValues);
	return result.rows.map((row) => ({
		documentKey: row.document_key,
		version: row.version,
	}));
}
