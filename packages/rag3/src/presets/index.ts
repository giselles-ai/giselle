/**
 * RAG3 default settings and utilities
 */

import type { z } from "zod/v4";
import type { ChunkStore } from "../chunk-store";
import { LineChunker } from "../chunker";
import type { ColumnMapping, RequiredColumns } from "../database/types";
import type { Document, DocumentLoader } from "../document-loader";
import { OpenAIEmbedder } from "../embedder";

/**
 * Default mapping for required columns
 */
export const DEFAULT_REQUIRED_COLUMNS: RequiredColumns = {
	documentKey: "document_key",
	content: "content",
	index: "index",
	embedding: "embedding",
} as const;

/**
 * Convert string to snake_case
 */
function toSnakeCase(str: string): string {
	return str
		.replace(/([A-Z])/g, "_$1")
		.toLowerCase()
		.replace(/^_/, "");
}

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
	 */
	embedder?: {
		embed: (text: string) => Promise<number[]>;
		embedMany: (texts: string[]) => Promise<number[][]>;
	};
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
 * type guard: check if ZodType has shape property
 */
function hasShapeProperty<T>(
	schema: z.ZodType<T>,
): schema is z.ZodType<T> & { shape: z.ZodRawShape } {
	if (!("shape" in schema)) {
		return false;
	}

	// if shape property exists, check the type
	// avoid type assertion and access safely
	const potentialShape = (schema as { shape?: unknown }).shape;
	return (
		potentialShape !== null &&
		potentialShape !== undefined &&
		typeof potentialShape === "object" &&
		!Array.isArray(potentialShape)
	);
}

/**
 * create column mapping from metadata schema
 */
export function createColumnMapping<
	TMetadata extends Record<string, unknown>,
>(options: {
	metadataSchema: z.ZodType<TMetadata>;
	requiredColumnOverrides?: Partial<RequiredColumns>;
	metadataColumnOverrides?: Partial<Record<keyof TMetadata, string>>;
}): ColumnMapping<TMetadata> {
	const { metadataSchema, requiredColumnOverrides, metadataColumnOverrides } =
		options;

	// set required columns
	const requiredColumns: RequiredColumns = {
		...DEFAULT_REQUIRED_COLUMNS,
		...requiredColumnOverrides,
	};

	// build metadata columns step by step
	const metadataColumns: Record<string, string> = {};

	if (metadataSchema && hasShapeProperty(metadataSchema)) {
		// if metadataSchema is a ZodObject, generate column names from field names
		const shape = metadataSchema.shape;
		const fieldNames = Object.keys(shape);

		for (const fieldName of fieldNames) {
			// type safe key access
			const customMapping =
				metadataColumnOverrides?.[fieldName as keyof TMetadata];
			if (customMapping) {
				// if custom mapping is specified
				metadataColumns[fieldName] = customMapping;
			} else if (!metadataColumns[fieldName]) {
				// if preset is not specified and custom mapping is not specified, convert to snake_case
				metadataColumns[fieldName] = toSnakeCase(fieldName);
			}
		}
	}

	// build type safe result
	const result: RequiredColumns & Record<string, string> = {
		...requiredColumns,
		...metadataColumns,
	};

	// at this point, result is structurally compatible with ColumnMapping<TMetadata>
	// TypeScript cannot infer the type correctly, so we use type assertion,
	// but the runtime safety is guaranteed by the step-by-step construction above
	return result as ColumnMapping<TMetadata>;
}

/**
 * create default embedder
 */
export function createDefaultEmbedder() {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error("OPENAI_API_KEY environment variable is required");
	}
	return new OpenAIEmbedder({
		apiKey,
		model: "text-embedding-3-small",
	});
}

/**
 * create default chunker
 */
export function createDefaultChunker() {
	return new LineChunker({
		maxLines: 150,
		overlap: 30,
		maxChars: 10000,
	});
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
		batchSize?: number;
		onProgress?: (progress: {
			processedDocuments: number;
			totalDocuments: number;
			currentDocument?: string;
		}) => void;
	};
}

// Re-export factory functions
export {
	createChunkStore,
	createIngestPipeline,
	createQueryService,
} from "./factories";
