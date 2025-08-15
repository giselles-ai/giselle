import type { z } from "zod/v4";
import { PoolManager } from "../../database/postgres";
import { ensurePgVectorTypes } from "../../database/postgres/pgvector-registry";
import type { DatabaseConfig } from "../../database/types";
import {
	ConfigurationError,
	DatabaseError,
	ValidationError,
} from "../../errors";
import type { RequiredColumns } from "../column-mapping";
import { createColumnMapping } from "../column-mapping";
import type { ChunkStore, ChunkWithEmbedding } from "../types";
import {
	deleteChunksByDocumentKey,
	deleteChunksByDocumentKeys,
	insertChunkRecords,
	prepareChunkRecords,
	queryDocumentVersions,
} from "./utils";

/**
 * Create a PostgreSQL chunk store
 */
export function createPostgresChunkStore<
	TSchema extends z.ZodType<Record<string, unknown>>,
>(config: {
	database: DatabaseConfig;
	tableName: string;
	metadataSchema: TSchema;
	scope: Record<string, unknown>;
	requiredColumnOverrides?: Partial<RequiredColumns>;
	metadataColumnOverrides?: Partial<Record<keyof z.infer<TSchema>, string>>;
}): ChunkStore<z.infer<TSchema>> {
	const {
		database,
		tableName,
		metadataSchema,
		scope,
		requiredColumnOverrides,
		metadataColumnOverrides,
	} = config;

	const columnMapping = createColumnMapping({
		metadataSchema,
		requiredColumnOverrides,
		metadataColumnOverrides,
	});

	// Hardcoded embedding profile for now (OpenAI text-embedding-3-small)
	const enrichedScope = {
		...scope,
		embedding_profile_id: 1,
		embedding_dimensions: 1536,
	};

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
				enrichedScope,
			);

			const records = prepareChunkRecords(
				documentKey,
				chunks,
				metadata,
				columnMapping,
				enrichedScope,
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
	async function deleteDocument(documentKey: string): Promise<void> {
		const pool = PoolManager.getPool(database);
		const client = await pool.connect();

		try {
			await ensurePgVectorTypes(client, database.connectionString);
			await deleteChunksByDocumentKey(
				client,
				tableName,
				documentKey,
				columnMapping.documentKey,
				enrichedScope,
			);
		} catch (error) {
			throw DatabaseError.queryFailed(
				`DELETE FROM ${tableName}`,
				error instanceof Error ? error : undefined,
				{
					operation: "deleteDocument",
					documentKey,
					tableName,
				},
			);
		} finally {
			client.release();
		}
	}

	/**
	 * Delete chunks associated with multiple document keys
	 */
	async function deleteBatch(documentKeys: string[]): Promise<void> {
		if (documentKeys.length === 0) {
			return;
		}

		const pool = PoolManager.getPool(database);
		const client = await pool.connect();

		try {
			await ensurePgVectorTypes(client, database.connectionString);

			await deleteChunksByDocumentKeys(
				client,
				tableName,
				documentKeys,
				columnMapping.documentKey,
				enrichedScope,
			);
		} catch (error) {
			throw DatabaseError.queryFailed(
				`DELETE FROM ${tableName}`,
				error instanceof Error ? error : undefined,
				{
					operation: "deleteBatch",
					documentKeyCount: documentKeys.length,
					tableName,
				},
			);
		} finally {
			client.release();
		}
	}

	/**
	 * Get document versions for differential ingestion
	 */
	async function getDocumentVersions(): Promise<
		Array<{
			documentKey: string;
			version: string;
		}>
	> {
		// Check version column before connecting to DB
		if (!columnMapping.version) {
			throw ConfigurationError.missingField("columnMapping.version", {
				hint: "Please provide systemColumns.version when calling createColumnMapping",
			});
		}

		const pool = PoolManager.getPool(database);
		const client = await pool.connect();

		try {
			await ensurePgVectorTypes(client, database.connectionString);

			return await queryDocumentVersions(
				client,
				tableName,
				columnMapping.documentKey,
				columnMapping.version,
				enrichedScope,
			);
		} catch (error) {
			throw DatabaseError.queryFailed(
				`SELECT DISTINCT ${columnMapping.documentKey}, ${columnMapping.version} FROM ${tableName}`,
				error instanceof Error ? error : undefined,
				{
					operation: "getDocumentVersions",
					tableName,
				},
			);
		} finally {
			client.release();
		}
	}

	return {
		insert,
		delete: deleteDocument,
		deleteBatch,
		getDocumentVersions,
	};
}
