import type { PoolClient } from "pg";
import * as pgvector from "pgvector/pg";
import { PoolManager } from "../../database/postgres";
import type { ColumnMapping, DatabaseConfig } from "../../database/types";
import { DatabaseError } from "../../errors";
import type { ChunkStore, ChunkWithEmbedding } from "../types";

export interface PostgresChunkStoreConfig<TMetadata> {
	database: DatabaseConfig;
	tableName: string;
	columnMapping: ColumnMapping<TMetadata>;
	// 全レコードに適用される静的な値
	staticContext?: Record<string, unknown>;
}

export class PostgresChunkStore<
	TMetadata extends Record<string, unknown> = Record<string, unknown>,
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
		} = this.config;
		const pool = PoolManager.getPool(database);

		// トランザクション開始
		const client = await pool.connect();
		try {
			await client.query("BEGIN");

			// 既存データを削除
			await this.deleteByDocumentKeyInternal(documentKey, client);

			// チャンクを挿入
			for (const chunk of chunks) {
				const record = {
					[columnMapping.documentKey]: documentKey,
					[columnMapping.content]: chunk.content,
					[columnMapping.index]: chunk.index,
					// embeddingはpgvectorで変換するため、ここでは含めない
					// メタデータをマッピング
					...this.mapMetadata(metadata, columnMapping),
					// 静的コンテキストを追加
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
			throw new DatabaseError(
				`Failed to insert chunks for document: ${documentKey}`,
				error instanceof Error ? error : undefined,
			);
		} finally {
			client.release();
		}
	}

	async deleteByDocumentKey(documentKey: string): Promise<void> {
		const pool = PoolManager.getPool(this.config.database);
		const client = await pool.connect();
		try {
			await this.deleteByDocumentKeyInternal(documentKey, client);
		} catch (error) {
			throw new DatabaseError(
				`Failed to delete chunks for document: ${documentKey}`,
				error instanceof Error ? error : undefined,
			);
		} finally {
			client.release();
		}
	}

	async dispose(): Promise<void> {
		// プール自体の管理は呼び出し側の責任
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

		// embeddingカラムを追加
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
		// PostgreSQLの識別子エスケープ
		return `"${identifier.replace(/"/g, '""')}"`;
	}
}
