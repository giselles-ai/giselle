import type { PoolClient } from "pg";
import * as pgvector from "pgvector/pg";
import type { z } from "zod/v4";
import { ensurePgVectorTypes } from "../../database/pgvector-registry";
import { PoolManager } from "../../database/postgres";
import type { ColumnMapping, DatabaseConfig } from "../../database/types";
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
	metadataSchema?: z.ZodType<TMetadata>;
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
		if (metadataSchema) {
			const result = metadataSchema.safeParse(metadata);
			if (!result.success) {
				throw ValidationError.fromZodError(result.error, {
					operation: "insert",
					documentKey,
					tableName,
				});
			}
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
					[columnMapping.content]: chunk.content,
					[columnMapping.index]: chunk.index,
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
		const { tableName, columnMapping } = this.config;

		const query = `
      DELETE FROM ${this.escapeIdentifier(tableName)}
      WHERE ${this.escapeIdentifier(columnMapping.documentKey)} = $1
    `;

		await client.query(query, [documentKey]);
	}

	/**
	 * Batch insert multiple records using optimal batching strategy
	 *
	 * Performance improvements over individual inserts:
	 * - Reduces network round-trips from N queries to 1 (or few batches)
	 * - Reduces PostgreSQL parsing overhead
	 * - Enables better transaction efficiency
	 * - Can improve throughput by 10-100x for large datasets
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
		const columns = Object.keys(firstRecord.record);
		columns.push(firstRecord.embedding.embeddingColumn);

		// Build values array for all records
		const allValues: unknown[] = [];
		const valuePlaceholders: string[] = [];

		records.forEach((item, recordIndex) => {
			const recordValues = Object.values(item.record);
			recordValues.push(pgvector.toSql(item.embedding.embeddingValue));

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
			INSERT INTO ${this.escapeIdentifier(tableName)}
			(${columns.map((c) => this.escapeIdentifier(c)).join(", ")})
			VALUES ${valuePlaceholders.join(", ")}
		`;

		await client.query(query, allValues);
	}

	/**
	 * Insert a single record (kept for compatibility, but batch insert is preferred)
	 */
	private async insertRecord(
		client: PoolClient,
		tableName: string,
		record: Record<string, unknown>,
		embedding?: {
			embeddingColumn: string;
			embeddingValue: number[];
		},
	): Promise<void> {
		const columns = Object.keys(record);
		const values = Object.values(record);

		// add embedding column
		if (embedding) {
			columns.push(embedding.embeddingColumn);
			values.push(pgvector.toSql(embedding.embeddingValue));
		}

		const placeholders = columns.map((_, i) => `$${i + 1}`);

		const query = `
      INSERT INTO ${this.escapeIdentifier(tableName)}
      (${columns.map((c) => this.escapeIdentifier(c)).join(", ")})
      VALUES (${placeholders.join(", ")})
    `;

		await client.query(query, values);
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
				!["documentKey", "content", "index", "embedding"].includes(key)
			) {
				const columnName = mapping[key as keyof typeof mapping];
				result[columnName] = value;
			}
		}

		return result;
	}

	private escapeIdentifier(identifier: string): string {
		// escape PostgreSQL identifier
		return `"${identifier.replace(/"/g, '""')}"`;
	}
}
