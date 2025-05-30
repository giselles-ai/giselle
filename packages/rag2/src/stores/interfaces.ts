// DB-agnostic interfaces for chunk storage and querying
import type { z } from "zod/v4";
import type { ColumnConfiguration } from "../config";
import type { MetadataDefinitionResult } from "../metadata";
// StorageSchemaConfig import removed - not used in interfaces
import type { DbValue, DocumentMetadata, QueryResult } from "../types";

// CQRS: Writer side (write operations) - DB agnostic
// TMetadata: Zod schema that produces DocumentMetadata-compatible output
// TChunk: Zod schema that produces ChunkWithEmbedding-compatible output
// Note: Runtime validation through schema parsing ensures type safety
export interface ChunkStore<
	TMetadata extends z.ZodTypeAny,
	TChunk extends z.ZodTypeAny,
> {
	/**
	 * Insert chunk data. Validates raw data against TChunk schema.
	 * @param rawChunkData - Raw chunk data to validate and insert
	 */
	insert(rawChunkData: z.input<TChunk>): Promise<void>;

	/**
	 * Delete chunks by document key. Validates raw metadata against TMetadata schema.
	 * @param documentMetadata - Raw document metadata to validate
	 */
	deleteByDocumentKey(documentMetadata: z.input<TMetadata>): Promise<void>;

	/**
	 * Delete all chunks by source keys from constructor context.
	 */
	deleteBySourceKeys(): Promise<void>;

	/**
	 * Clean up resources.
	 */
	dispose(): Promise<void>;
}

export interface QueryService<
	M extends DocumentMetadata = DocumentMetadata,
	TContext = Record<string, unknown>,
> {
	searchByQuestion(params: {
		question: string;
		limit: number;
		similarityThreshold: number;
		context: TContext;
	}): Promise<QueryResult<M>[]>;
	// Resource cleanup
	dispose(): Promise<void>;
}

// CQRS: Query side (search/query operations) - DB agnostic
export interface QueryServiceConfig<
	TContext = Record<string, unknown>,
	TMetadata extends DocumentMetadata = DocumentMetadata,
> {
	tableName: string;
	metadataDefinition: MetadataDefinitionResult<TMetadata>;
	filterResolver?: (
		context: TContext,
	) => Promise<Record<string, DbValue>> | Record<string, DbValue>;
	columnConfig?: ColumnConfiguration;
}
