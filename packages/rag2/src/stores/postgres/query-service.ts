import { type ClientConfig, Pool } from "pg";
import * as pgvector from "pgvector/pg";
import { z } from "zod/v4";
import {
	type ColumnConfiguration,
	DEFAULT_COLUMN_CONFIG,
	type EmbedderConfig,
} from "../../config";
import { createOpenAIEmbedder } from "../../embedders/openai-embedder";
import {
	Chunk,
	DbValue,
	type DocumentMetadata,
	type Embedder,
	type QueryResult,
} from "../../types";
import type { QueryService, QueryServiceConfig } from "../interfaces";
import { validateSqlIdentifier } from "./sql-validation";

export class PostgresQueryService<
	TContext = Record<string, unknown>,
	TMetadata extends DocumentMetadata = DocumentMetadata,
> implements QueryService<TMetadata, TContext>
{
	private pool: Pool;
	private embedder: Embedder;
	private config: QueryServiceConfig<TContext, TMetadata>;
	private initializationPromise: Promise<void> | null = null;
	private readonly MAX_CONNECTIONS = 5;
	private readonly IDLE_TIMEOUT_MILLIS = 30000; // 30 seconds
	private readonly CONNECTION_TIMEOUT_MILLIS = 2000; // 2 seconds

	constructor(
		postgresConfig: ClientConfig,
		config: QueryServiceConfig<TContext, TMetadata>,
		embedderConfig?: EmbedderConfig,
	) {
		this.pool = new Pool({
			...postgresConfig,
			max: this.MAX_CONNECTIONS,
			idleTimeoutMillis: this.IDLE_TIMEOUT_MILLIS,
			connectionTimeoutMillis: this.CONNECTION_TIMEOUT_MILLIS,
		});

		this.config = config;

		validateSqlIdentifier(this.config.tableName);

		this.embedder = this.createEmbedder(embedderConfig);
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
			// Log error but don't throw to avoid masking original errors
			console.error("Error during QueryService disposal:", error);
		}
	}

	async shutdown(): Promise<void> {
		await this.dispose();
	}

	async searchByQuestion(params: {
		question: string;
		limit: number;
		similarityThreshold: number;
		context: TContext;
	}): Promise<QueryResult<TMetadata>[]> {
		await this.initialize();

		// Validate input parameters
		if (!params.question.trim()) {
			throw new Error("Question cannot be empty");
		}
		if (params.limit < 1 || params.limit > 1000) {
			throw new Error("Limit must be between 1-1000");
		}
		if (params.similarityThreshold < 0 || params.similarityThreshold > 1) {
			throw new Error("Similarity threshold must be between 0-1");
		}

		const { question, limit, similarityThreshold, context } = params;

		const embedding = await this.embedder.embed(question);

		// Validate embedding result from external API
		if (!Array.isArray(embedding) || embedding.length === 0) {
			throw new Error("Failed to generate valid embedding: empty result");
		}

		// Apply filter resolver to convert context to database filters
		let resolvedFilters: Record<string, DbValue> = {};
		if (this.config.filterResolver) {
			resolvedFilters = await this.config.filterResolver(context);
		}

		const filterConditions: string[] = [];
		const filterValues: DbValue[] = [];

		for (const [field, value] of Object.entries(resolvedFilters)) {
			if (value !== undefined) {
				// Validate field name as SQL identifier
				try {
					validateSqlIdentifier(field);
				} catch (error) {
					throw new Error(
						`Invalid filter field name '${field}': ${error instanceof Error ? error.message : "Unknown error"}`,
					);
				}

				// Validate filter value
				const filterValueValidation = DbValue.safeParse(value);
				if (!filterValueValidation.success) {
					throw new Error(
						`Invalid filter value for '${field}': ${filterValueValidation.error.issues.map((i) => i.message).join(", ")}`,
					);
				}

				filterConditions.push(`${field} = $${filterValues.length + 3}`); // Start from $3 (after embedding and threshold)
				filterValues.push(filterValueValidation.data);
			}
		}

		const whereClause =
			filterConditions.length > 0
				? `AND ${filterConditions.join(" AND ")}`
				: "";

		// Execute query with pgvector similarity search
		// $1: embedding vector for similarity calculation
		// $2: similarity threshold
		// $3+: filter values
		const selectColumns = this.getSelectColumnsString();
		const columnConfig = this.getColumnConfiguration();
		const query = `
			SELECT ${selectColumns}, (1 - (${columnConfig.embedding} <=> $1)) as similarity
			FROM ${this.config.tableName}
			WHERE (1 - (${columnConfig.embedding} <=> $1)) >= $2
			${whereClause}
			ORDER BY similarity DESC
			LIMIT ${limit}
		`;

		// Convert embedding array to pgvector format with validation
		try {
			const vectorValue = pgvector.toSql(embedding);
			const queryValues = [vectorValue, similarityThreshold, ...filterValues];

			const result = await this.pool.query(query, queryValues);

			return result.rows.map((row, index) => {
				try {
					const metadata =
						this.config.metadataDefinition.transformToMetadata(row);
					const chunk = this.extractChunkData(row);
					const similarity = row.similarity;

					const similarityValidation = z
						.number()
						.min(0)
						.max(1)
						.safeParse(similarity);
					if (!similarityValidation.success) {
						throw new Error(
							`Invalid similarity value in row ${index}: ${similarityValidation.error.issues.map((i) => i.message).join(", ")}`,
						);
					}

					return {
						metadata: metadata,
						chunk: chunk,
						similarity: similarityValidation.data,
					};
				} catch (error) {
					throw new Error(
						`Failed to transform result row ${index}: ${error instanceof Error ? error.message : "Unknown error"}`,
					);
				}
			});
		} catch (error) {
			throw new Error(
				`Database query execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	protected buildSelectColumns(): string[] {
		const columnConfig = this.getColumnConfiguration();

		// Base columns + metadata columns
		return [
			columnConfig.chunkContent,
			columnConfig.chunkIndex,
			...this.config.metadataDefinition.selectColumns,
		];
	}

	private getSelectColumnsString(): string {
		return this.buildSelectColumns().join(", ");
	}

	protected getColumnConfiguration(): ColumnConfiguration {
		return this.config.columnConfig ?? DEFAULT_COLUMN_CONFIG;
	}

	private createEmbedder(config?: EmbedderConfig): Embedder {
		const provider = config?.provider ?? "openai";

		switch (provider) {
			case "openai":
				return createOpenAIEmbedder(config?.model);
			default: {
				const _exhaustiveCheck: never = provider;
				throw new Error(`Unsupported embedder provider: ${_exhaustiveCheck}`);
			}
		}
	}

	private extractChunkData(row: Record<string, unknown>): Chunk {
		// Enhanced chunk extraction with comprehensive validation
		const columnConfig = this.getColumnConfiguration();

		// Validate that required fields exist in the row
		const requiredFields = [columnConfig.chunkContent, columnConfig.chunkIndex];
		const missingFields = requiredFields.filter((field) => !(field in row));
		if (missingFields.length > 0) {
			throw new Error(
				`Missing required chunk fields in database row: ${missingFields.join(", ")}`,
			);
		}

		// Create chunk data object
		const chunkData = {
			content: row[columnConfig.chunkContent],
			index: row[columnConfig.chunkIndex],
		};

		// Parse with enhanced error reporting
		const chunkValidation = Chunk.safeParse(chunkData);
		if (!chunkValidation.success) {
			throw new Error(
				`Invalid chunk data extracted from database row: ${chunkValidation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
			);
		}

		return chunkValidation.data;
	}
}

export function createPostgresQueryService<
	TContext = Record<string, unknown>,
	TMetadata extends DocumentMetadata = DocumentMetadata,
>(
	postgresConfig: ClientConfig,
	config: QueryServiceConfig<TContext, TMetadata>,
	embedderConfig?: EmbedderConfig,
): QueryService<TMetadata, TContext> {
	return new PostgresQueryService(postgresConfig, config, embedderConfig);
}
