import type { z } from "zod/v4";
import { PoolManager } from "../../database/postgres";
import { ensurePgVectorTypes } from "../../database/postgres/pgvector-registry";
import type { ColumnMapping, DatabaseConfig } from "../../database/types";
import { DatabaseError, ValidationError } from "../../errors";
import type { ChunkStore, ChunkWithEmbedding } from "../types";
import {
	deleteChunksByDocumentKey,
	insertChunkRecords,
	prepareChunkRecords,
} from "./utils";

/**
 * Create a PostgreSQL chunk store
 */
export function createPostgresChunkStore<
	TSchema extends z.ZodType<Record<string, unknown>>,
>(config: {
	database: DatabaseConfig;
	tableName: string;
	columnMapping: ColumnMapping<z.infer<TSchema>>;
	metadataSchema: TSchema;
	scope: Record<string, unknown>;
}): ChunkStore<z.infer<TSchema>> {
	const { database, tableName, columnMapping, metadataSchema, scope } = config;

	/**
	 * Insert chunks with metadata
	 */
	async function insert(
		documentKey: string,
		chunks: ChunkWithEmbedding[],
		metadata: z.infer<TSchema>,
	): Promise<void> {
		const result = metadataSchema.safeParse(metadata);
		if (!result.success) {
			throw ValidationError.fromZodError(result.error, {
				operation: "insert",
				documentKey,
				tableName,
			});
		}

		if (chunks.length === 0) {
			return;
		}

		const pool = PoolManager.getPool(database);
		const client = await pool.connect();

		try {
			await ensurePgVectorTypes(client, database.connectionString);

			await client.query("BEGIN");

			await deleteChunksByDocumentKey(
				client,
				tableName,
				documentKey,
				columnMapping.documentKey,
				scope,
			);

			const records = prepareChunkRecords(
				documentKey,
				chunks,
				metadata,
				columnMapping,
				scope,
			);
			await insertChunkRecords(client, tableName, records);

			await client.query("COMMIT");
		} catch (error) {
			await client.query("ROLLBACK");
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

	/**
	 * Delete chunks by document key
	 */
	async function deleteByDocumentKey(documentKey: string): Promise<void> {
		const pool = PoolManager.getPool(database);
		const client = await pool.connect();

		try {
			await ensurePgVectorTypes(client, database.connectionString);
			await deleteChunksByDocumentKey(
				client,
				tableName,
				documentKey,
				columnMapping.documentKey,
				scope,
			);
		} catch (error) {
			throw DatabaseError.queryFailed(
				`DELETE FROM ${tableName}`,
				error instanceof Error ? error : undefined,
				{
					operation: "deleteByDocumentKey",
					documentKey,
					tableName,
				},
			);
		} finally {
			client.release();
		}
	}

	return {
		insert,
		deleteByDocumentKey,
	};
}
