import type { PoolClient } from "pg";
import * as pgvector from "pgvector/pg";
import type { z } from "zod/v4";
import { ensurePgVectorTypes } from "../../database/pgvector-registry";
import { PoolManager } from "../../database/postgres";
import type { ColumnMapping, DatabaseConfig } from "../../database/types";
import { DatabaseError, ValidationError } from "../../errors";
import type { ChunkStore, ChunkWithEmbedding } from "../types";

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

		const pool = PoolManager.getPool(database);
		// register pgvector types using singleton registry
		const client = await pool.connect();
		try {
			await ensurePgVectorTypes(client, database.connectionString);
		} finally {
			client.release();
		}

		try {
			await client.query("BEGIN");

			await this.deleteByDocumentKeyInternal(documentKey, client);

			for (const chunk of chunks) {
				const record = {
					[columnMapping.documentKey]: documentKey,
					[columnMapping.content]: chunk.content,
					[columnMapping.index]: chunk.index,
					// embedding is converted by pgvector, so it is not included here
					// map metadata
					...this.mapMetadata(metadata, columnMapping),
					// add static context
					...staticContext,
				};

				await this.insertRecord(client, tableName, record, {
					embeddingColumn: columnMapping.embedding,
					embeddingValue: chunk.embedding,
				});
			}

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
		// register pgvector types using singleton registry
		const client = await pool.connect();
		try {
			await ensurePgVectorTypes(client, this.config.database.connectionString);
		} finally {
			client.release();
		}

		try {
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
