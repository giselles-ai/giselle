import { type ClientConfig, Pool, type PoolClient } from "pg";
import * as pgvector from "pgvector/pg";
import type { z } from "zod/v4";
import type { StorageSchemaConfig } from "../../storage-schema";
import { type DbValue, isDbValue } from "../../types";
import type { ChunkStore } from "../interfaces";
import { validateSqlIdentifier } from "./sql-validation";

export class DocumentChunkStore<
	TMetadata extends z.ZodTypeAny,
	TChunk extends z.ZodTypeAny,
	TDocType extends StorageSchemaConfig<TMetadata, TChunk>,
> implements ChunkStore<TMetadata, TChunk>
{
	private pool: Pool;
	private initializationPromise: Promise<void> | null = null;
	private readonly MAX_CONNECTIONS = 5;
	private readonly IDLE_TIMEOUT_MILLIS = 30000;
	private readonly CONNECTION_TIMEOUT_MILLIS = 2000;

	constructor(
		postgresConfig: ClientConfig,
		private documentType: TDocType,
		private tableName: string,
		private sourceContext: Record<string, DbValue>,
	) {
		this.pool = new Pool({
			...postgresConfig,
			max: this.MAX_CONNECTIONS,
			idleTimeoutMillis: this.IDLE_TIMEOUT_MILLIS,
			connectionTimeoutMillis: this.CONNECTION_TIMEOUT_MILLIS,
		});

		validateSqlIdentifier(this.tableName);
	}

	private async initialize(): Promise<void> {
		if (this.initializationPromise) {
			return this.initializationPromise;
		}

		this.initializationPromise = this.performInitialization();

		try {
			await this.initializationPromise;
		} catch (error) {
			this.initializationPromise = null;
			throw error;
		}
	}

	private async performInitialization(): Promise<void> {
		const client = await this.pool.connect();
		try {
			await pgvector.registerTypes(client);
		} finally {
			client.release();
		}
	}

	async dispose(): Promise<void> {
		try {
			await this.pool.end();
		} catch (error) {
			console.error("Error during ChunkStore disposal:", error);
		}
	}

	async insert(rawChunkData: z.input<TChunk>): Promise<void> {
		await this.initialize();

		// Validate and convert raw data to typed chunk data - now type-safe
		const chunkData = this.documentType.chunkSchema.parse(rawChunkData);

		const client = await this.pool.connect();
		try {
			await this.insertSingle(client, chunkData);
		} catch (error) {
			throw new Error(
				`Database insertion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			client.release();
		}
	}

	private async insertSingle(
		client: PoolClient,
		chunkData: z.infer<TChunk>,
	): Promise<void> {
		// Build database record
		const dbRow: Record<string, DbValue> = {
			[this.documentType.chunkContentColumnName]: chunkData.content,
			[this.documentType.chunkIndexColumnName]: chunkData.index,
			[this.documentType.embeddingColumnName]: chunkData.embedding,
		};

		// Map metadata fields using column mapping
		for (const [metadataKey, columnName] of Object.entries(
			this.documentType.columnMapping,
		)) {
			const value = chunkData[metadataKey as keyof typeof chunkData];
			if (value !== undefined) {
				validateSqlIdentifier(columnName);
				if (!isDbValue(value)) {
					throw new Error(
						`Invalid DbValue for metadata field '${metadataKey}': expected string, number, boolean, null, Date, or number[], got ${typeof value}`,
					);
				}
				dbRow[columnName] = value; // Type-safe after guard
			}
		}

		// Add source context from constructor
		for (const [key, value] of Object.entries(this.sourceContext)) {
			validateSqlIdentifier(key);
			dbRow[key] = value;
		}

		const columns = Object.keys(dbRow);
		const placeholders = columns.map((_, index) => `$${index + 1}`);

		const values = columns.map((col) => {
			const value = dbRow[col];
			if (col === this.documentType.embeddingColumnName) {
				return pgvector.toSql(value);
			}
			return value;
		});

		const query = `
			INSERT INTO ${this.tableName} (${columns.join(", ")})
			VALUES (${placeholders.join(", ")})
		`;

		await client.query(query, values);
	}

	async deleteByDocumentKey(
		documentMetadata: z.input<TMetadata>,
	): Promise<void> {
		await this.initialize();

		// Validate and convert raw metadata to typed metadata - now type-safe
		const validatedMetadata =
			this.documentType.documentMetadataSchema.parse(documentMetadata);

		const whereConditions: string[] = [];
		const queryValues: DbValue[] = [];

		// Add source key conditions from constructor sourceContext
		for (const sourceKey of this.documentType.sourceKeys) {
			const columnName = this.documentType.columnMapping[sourceKey];
			if (columnName && this.sourceContext[sourceKey] !== undefined) {
				validateSqlIdentifier(columnName);
				whereConditions.push(`${columnName} = $${queryValues.length + 1}`);
				queryValues.push(this.sourceContext[sourceKey]);
			}
		}

		// Add document key condition
		const documentKeyColumn =
			this.documentType.columnMapping[this.documentType.documentKey];
		if (documentKeyColumn) {
			validateSqlIdentifier(documentKeyColumn);
			whereConditions.push(`${documentKeyColumn} = $${queryValues.length + 1}`);
			// Type-safe access to document key value
			const documentKeyValue =
				validatedMetadata[
					this.documentType.documentKey as keyof typeof validatedMetadata
				];
			if (!isDbValue(documentKeyValue)) {
				throw new Error(
					`Invalid DbValue for document key '${this.documentType.documentKey}': expected string, number, boolean, null, Date, or number[], got ${typeof documentKeyValue}`,
				);
			}
			queryValues.push(documentKeyValue); // Type-safe after guard
		}

		if (whereConditions.length === 0) {
			throw new Error("No valid conditions for document deletion");
		}

		const query = `
			DELETE FROM ${this.tableName}
			WHERE ${whereConditions.join(" AND ")}
		`;

		try {
			await this.pool.query(query, queryValues);
		} catch (error) {
			throw new Error(
				`Document deletion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async deleteBySourceKeys(): Promise<void> {
		await this.initialize();

		const whereConditions: string[] = [];
		const queryValues: DbValue[] = [];

		// Add source key conditions from constructor sourceContext
		for (const sourceKey of this.documentType.sourceKeys) {
			const columnName = this.documentType.columnMapping[sourceKey];
			if (columnName && this.sourceContext[sourceKey] !== undefined) {
				validateSqlIdentifier(columnName);
				whereConditions.push(`${columnName} = $${queryValues.length + 1}`);
				queryValues.push(this.sourceContext[sourceKey]);
			}
		}

		if (whereConditions.length === 0) {
			throw new Error("No valid source keys provided for deletion");
		}

		const query = `
			DELETE FROM ${this.tableName}
			WHERE ${whereConditions.join(" AND ")}
		`;

		try {
			await this.pool.query(query, queryValues);
		} catch (error) {
			throw new Error(
				`Source deletion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}
}

// Factory function for creating document chunk store
export function createDocumentChunkStore<
	TMetadata extends z.ZodTypeAny,
	TChunk extends z.ZodTypeAny,
	TDocType extends StorageSchemaConfig<TMetadata, TChunk>,
>(
	postgresConfig: ClientConfig,
	documentType: TDocType,
	tableName: string,
	sourceContext: Record<string, DbValue>,
): DocumentChunkStore<TMetadata, TChunk, TDocType> {
	return new DocumentChunkStore(
		postgresConfig,
		documentType,
		tableName,
		sourceContext,
	);
}
