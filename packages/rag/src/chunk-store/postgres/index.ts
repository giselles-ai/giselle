import type { PoolClient } from "pg";
import { escapeIdentifier } from "pg";
import * as pgvector from "pgvector/pg";
import type { z } from "zod/v4";
import { PoolManager } from "../../database/postgres";
import { ensurePgVectorTypes } from "../../database/postgres/pgvector-registry";
import {
	type ColumnMapping,
	type DatabaseConfig,
	REQUIRED_COLUMN_KEYS,
} from "../../database/types";
import { DatabaseError, ValidationError } from "../../errors";
import type { ChunkStore, ChunkWithEmbedding } from "../types";

/**
 * Performance constants for batch operations
 */
const PERFORMANCE_CONSTANTS = {
	/**
	 * Maximum number of records to insert in a single batch
	 * Limited by PostgreSQL parameter limit (typically 65535)
	 * With ~10 columns per record, this allows safe batching
	 */
	MAX_BATCH_SIZE: 5000,
} as const;

export interface PostgresChunkStoreConfig<TMetadata> {
	database: DatabaseConfig;
	tableName: string;
	columnMapping: ColumnMapping<TMetadata>;
	// Zod schema for metadata validation
	metadataSchema: z.ZodType<TMetadata>;
	// static context to be applied to all records
	staticContext?: Record<string, unknown>;
}

export class PostgresChunkStore<
	TMetadata extends Record<string, unknown> = Record<string, never>,
> implements ChunkStore<TMetadata>
{
	constructor(private config: PostgresChunkStoreConfig<TMetadata>) {}

	async insert(
		documentKey: string,
		chunks: ChunkWithEmbedding[],
		metadata: TMetadata,
	): Promise<void> {
		const {
			database,
			tableName,
			columnMapping,
			staticContext = {},
			metadataSchema,
		} = this.config;

		// Validate metadata first (fail fast)
		const result = metadataSchema.safeParse(metadata);
		if (!result.success) {
			throw ValidationError.fromZodError(result.error, {
				operation: "insert",
				documentKey,
				tableName,
			});
		}

		// Early return for empty chunks
		if (chunks.length === 0) {
			return;
		}

		const pool = PoolManager.getPool(database);
		const client = await pool.connect();

		try {
			// Register pgvector types once per connection
			await ensurePgVectorTypes(client, database.connectionString);

			// Start transaction
			await client.query("BEGIN");

			// Delete existing chunks for this document
			await this.deleteByDocumentKeyInternal(documentKey, client);

			// Prepare all records for batch insert
			const records = chunks.map((chunk) => ({
				record: {
					[columnMapping.documentKey]: documentKey,
					[columnMapping.chunkContent]: chunk.content,
					[columnMapping.chunkIndex]: chunk.index,
					// map metadata
					...this.mapMetadata(metadata, columnMapping),
					// add static context
					...staticContext,
				},
				embedding: {
					embeddingColumn: columnMapping.embedding,
					embeddingValue: chunk.embedding,
				},
			}));

			// Batch insert all chunks in a single query
			await this.insertRecords(client, tableName, records);

			await client.query("COMMIT");
		} catch (error) {
			await client.query("ROLLBACK");
			if (error instanceof ValidationError) {
				throw error;
			}
			throw DatabaseError.transactionFailed(
				"chunk insertion",
				error instanceof Error ? error : undefined,
				{
					operation: "insert",
					documentKey,
					tableName,
					chunkCount: chunks.length,
				},
			);
		} finally {
			client.release();
		}
	}

	async deleteByDocumentKey(documentKey: string): Promise<void> {
		const pool = PoolManager.getPool(this.config.database);
		const client = await pool.connect();

		try {
			// Register pgvector types and execute deletion in single connection
			await ensurePgVectorTypes(client, this.config.database.connectionString);
			await this.deleteByDocumentKeyInternal(documentKey, client);
		} catch (error) {
			throw DatabaseError.queryFailed(
				`DELETE FROM ${this.config.tableName}`,
				error instanceof Error ? error : undefined,
				{
					operation: "deleteByDocumentKey",
					documentKey,
					tableName: this.config.tableName,
				},
			);
		} finally {
			client.release();
		}
	}

	private async deleteByDocumentKeyInternal(
		documentKey: string,
		client: PoolClient,
	): Promise<void> {
		const { tableName, columnMapping, staticContext = {} } = this.config;

		let query = `
      DELETE FROM ${escapeIdentifier(tableName)}
      WHERE ${escapeIdentifier(columnMapping.documentKey)} = $1
    `;

		const queryParams: unknown[] = [documentKey];

		// Add static context conditions
		for (const [key, value] of Object.entries(staticContext)) {
			queryParams.push(value);
			query += ` AND ${escapeIdentifier(key)} = $${queryParams.length}`;
		}

		await client.query(query, queryParams);
	}

	/**
	 * Batch insert multiple records using optimal batching strategy
	 */
	private async insertRecords(
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

		// Process in batches if records exceed safe limit
		if (records.length > PERFORMANCE_CONSTANTS.MAX_BATCH_SIZE) {
			for (
				let i = 0;
				i < records.length;
				i += PERFORMANCE_CONSTANTS.MAX_BATCH_SIZE
			) {
				const batch = records.slice(
					i,
					i + PERFORMANCE_CONSTANTS.MAX_BATCH_SIZE,
				);
				await this.insertRecordsBatch(client, tableName, batch);
			}
			return;
		}

		// Single batch insert for smaller datasets
		await this.insertRecordsBatch(client, tableName, records);
	}

	/**
	 * Insert a single batch of records
	 */
	private async insertRecordsBatch(
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
		// Get column names from the first record (all records should have same structure)
		const firstRecord = records[0];
		const columns = [
			...Object.keys(firstRecord.record),
			firstRecord.embedding.embeddingColumn,
		];

		// Build values array for all records
		const allValues: unknown[] = [];
		const valuePlaceholders: string[] = [];

		records.forEach((item, recordIndex) => {
			const recordValues = columns.map((c) =>
				c === item.embedding.embeddingColumn
					? pgvector.toSql(item.embedding.embeddingValue)
					: item.record[c],
			);

			// Add values to the flat array
			allValues.push(...recordValues);

			// Create placeholders for this record
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

	private mapMetadata(
		metadata: TMetadata,
		mapping: Record<string, string>,
	): Record<string, unknown> {
		const result: Record<string, unknown> = {};

		const metadataObj = metadata;
		for (const [key, value] of Object.entries(metadataObj)) {
			if (
				key in mapping &&
				!(REQUIRED_COLUMN_KEYS as readonly string[]).includes(key)
			) {
				const columnName = mapping[key as keyof typeof mapping];
				result[columnName] = value;
			}
		}

		return result;
	}
}
