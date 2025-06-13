import type { z } from "zod/v4";
import { LineChunker } from "../chunker";
import type { ColumnMapping, RequiredColumns } from "../database/types";
import { REQUIRED_COLUMN_KEYS } from "../database/types";
import { OpenAIEmbedder } from "../embedder";

/**
 * Default configuration values for factory functions
 */
const FACTORY_DEFAULTS = {
	/**
	 * Default OpenAI embedding model
	 */
	OPENAI_MODEL: "text-embedding-3-small",

	/**
	 * Default line chunker configuration
	 */
	CHUNKER: {
		MAX_LINES: 150,
		OVERLAP: 30,
		MAX_CHARS: 10000,
	},
} as const;

/**
 * Default mapping for required columns
 */
const DEFAULT_REQUIRED_COLUMNS: RequiredColumns = {
	documentKey: "document_key",
	chunkContent: "chunk_content",
	chunkIndex: "chunk_index",
	embedding: "embedding",
} as const;

/**
 * Convert string to snake_case
 */
function toSnakeCase(str: string): string {
	return str.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
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
 * Validates that an object has all required columns for a ColumnMapping
 */
function validateColumnMapping<TMetadata extends Record<string, unknown>>(
	obj: RequiredColumns & Record<string, string>,
	metadataSchema: z.ZodType<TMetadata>,
): obj is ColumnMapping<TMetadata> {
	// Check that all required columns are present
	for (const key of REQUIRED_COLUMN_KEYS) {
		if (!(key in obj) || typeof obj[key] !== "string") {
			return false;
		}
	}

	// If schema has shape property, validate metadata keys
	if (hasShapeProperty(metadataSchema)) {
		const metadataKeys = Object.keys(metadataSchema.shape);
		for (const key of metadataKeys) {
			if (!(key in obj) || typeof obj[key] !== "string") {
				return false;
			}
		}
	}

	return true;
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

	// build result
	const result: RequiredColumns & Record<string, string> = {
		...requiredColumns,
		...metadataColumns,
	};

	// Runtime validation ensures type safety
	if (!validateColumnMapping(result, metadataSchema)) {
		throw new Error(
			"Failed to create valid ColumnMapping: missing required columns or metadata fields",
		);
	}

	// Now we can safely return the validated result
	return result;
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
		model: FACTORY_DEFAULTS.OPENAI_MODEL,
	});
}

/**
 * create default chunker
 */
export function createDefaultChunker() {
	return new LineChunker({
		maxLines: FACTORY_DEFAULTS.CHUNKER.MAX_LINES,
		overlap: FACTORY_DEFAULTS.CHUNKER.OVERLAP,
		maxChars: FACTORY_DEFAULTS.CHUNKER.MAX_CHARS,
	});
}
