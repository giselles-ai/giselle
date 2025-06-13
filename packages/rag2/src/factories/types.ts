import type { z } from "zod/v4";
import type { ChunkStore } from "../chunk-store";
import type { ColumnMapping, RequiredColumns } from "../database/types";
import type { Document, DocumentLoader } from "../document-loader";
import type { Embedder } from "../embedder";

/**
 * chunk store config
 */
export interface ChunkStoreConfig<TMetadata extends Record<string, unknown>> {
	/**
	 * database config
	 */
	database: {
		connectionString: string;
		poolConfig?: {
			max?: number;
			idleTimeoutMillis?: number;
			connectionTimeoutMillis?: number;
		};
	};
	/**
	 * table name
	 */
	tableName: string;
	/**
	 * metadata schema
	 */
	metadataSchema: z.ZodType<TMetadata>;
	/**
	 * required column overrides
	 */
	requiredColumnOverrides?: Partial<RequiredColumns>;
	/**
	 * metadata column overrides
	 */
	metadataColumnOverrides?: Partial<Record<keyof TMetadata, string>>;
	/**
	 * column mapping
	 */
	columnMapping?: ColumnMapping<TMetadata>;
	/**
	 * static context
	 */
	staticContext?: Record<string, unknown>;
}

/**
 * query service config
 */
export interface QueryServiceConfig<
	TContext,
	TMetadata extends Record<string, unknown>,
> {
	/**
	 * database config
	 */
	database: {
		connectionString: string;
		poolConfig?: {
			max?: number;
			idleTimeoutMillis?: number;
			connectionTimeoutMillis?: number;
		};
	};
	/**
	 * table name
	 */
	tableName: string;
	/**
	 * embedder
	 * if not provided, a default embedder will be used
	 */
	embedder?: Embedder;
	/**
	 * context to filter
	 */
	contextToFilter: (
		context: TContext,
	) => Record<string, unknown> | Promise<Record<string, unknown>>;
	/**
	 * metadata schema
	 */
	metadataSchema: z.ZodType<TMetadata>;
	/**
	 * required column overrides
	 */
	requiredColumnOverrides?: Partial<RequiredColumns>;
	/**
	 * metadata column overrides
	 */
	metadataColumnOverrides?: Partial<Record<keyof TMetadata, string>>;
	/**
	 * column mapping
	 */
	columnMapping?: ColumnMapping<TMetadata>;
}

/**
 * simplified ingest pipeline config
 */
export interface SimpleIngestConfig<
	TSourceMetadata extends Record<string, unknown>,
	TTargetMetadata extends Record<string, unknown> = TSourceMetadata,
> {
	/**
	 * document loader
	 */
	documentLoader: DocumentLoader<TSourceMetadata>;
	/**
	 * chunk store
	 */
	chunkStore: ChunkStore<TTargetMetadata>;
	/**
	 * document key function
	 */
	documentKey: (document: Document<TSourceMetadata>) => string;
	/**
	 * metadata transform function
	 */
	metadataTransform: (metadata: TSourceMetadata) => TTargetMetadata;
	/**
	 * pipeline options
	 */
	options?: {
		maxBatchSize?: number;
		onProgress?: (progress: {
			processedDocuments: number;
			currentDocument?: string;
		}) => void;
	};
}
