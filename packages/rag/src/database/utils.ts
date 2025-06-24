import { z } from "zod/v4";
import type { ColumnMapping, RequiredColumns } from "./types";
import { REQUIRED_COLUMN_KEYS } from "./types";

const DEFAULT_REQUIRED_COLUMNS: RequiredColumns = {
	documentKey: "document_key",
	chunkContent: "chunk_content",
	chunkIndex: "chunk_index",
	embedding: "embedding",
	version: "version",
} as const;

function toSnakeCase(str: string): string {
	return str.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

/**
 * Get all field names from a Zod schema if it's an object schema.
 * Returns an empty array for non-object schemas.
 * This is used to determine which fields need column mappings in the database.
 */
function getSchemaFieldNames<T>(schema: z.ZodType<T>): string[] {
	if (schema instanceof z.ZodObject) {
		return Object.keys(schema.shape);
	}
	return [];
}

/**
 * Validates that a column mapping contains all required fields.
 */
function validateColumnMapping<TMetadata>(
	mapping: Record<string, string>,
	metadataSchema: z.ZodType<TMetadata>,
): mapping is ColumnMapping<TMetadata> {
	const missingRequiredColumns = REQUIRED_COLUMN_KEYS.filter(
		(key) => !(key in mapping),
	);
	if (missingRequiredColumns.length > 0) {
		return false;
	}

	const metadataFields = getSchemaFieldNames(metadataSchema);
	const missingMetadataColumns = metadataFields.filter(
		(field) => !(field in mapping),
	);
	if (missingMetadataColumns.length > 0) {
		return false;
	}

	return true;
}

/**
 * create column mapping
 * convert metadata field names to snake_case as default database column names
 */
export function createColumnMapping<
	TSchema extends z.ZodType<Record<string, unknown>>,
>(options: {
	metadataSchema: TSchema;
	requiredColumnOverrides?: Partial<RequiredColumns>;
	metadataColumnOverrides?: Partial<Record<keyof z.infer<TSchema>, string>>;
}): ColumnMapping<z.infer<TSchema>> {
	const { metadataSchema, requiredColumnOverrides, metadataColumnOverrides } =
		options;

	type TMetadata = z.infer<TSchema>;

	// Build required columns
	const requiredColumns: RequiredColumns = {
		...DEFAULT_REQUIRED_COLUMNS,
		...requiredColumnOverrides,
	};

	// Build metadata columns
	const metadataFields = getSchemaFieldNames(metadataSchema);
	const metadataEntries = metadataFields.map((fieldName) => {
		const customMapping =
			metadataColumnOverrides?.[fieldName as keyof TMetadata];
		return [fieldName, customMapping ?? toSnakeCase(fieldName)];
	});

	const allEntries = [...Object.entries(requiredColumns), ...metadataEntries];
	const result = Object.fromEntries(allEntries);

	if (!validateColumnMapping(result, metadataSchema)) {
		const missingRequired = REQUIRED_COLUMN_KEYS.filter(
			(key) => !(key in result),
		);
		const metadataFields = getSchemaFieldNames(metadataSchema);
		const missingMetadata = metadataFields.filter(
			(field) => !(field in result),
		);

		const errorParts: string[] = [];
		if (missingRequired.length > 0) {
			errorParts.push(
				`Missing required columns: ${missingRequired.join(", ")}`,
			);
		}
		if (missingMetadata.length > 0) {
			errorParts.push(
				`Missing metadata columns: ${missingMetadata.join(", ")}`,
			);
		}

		throw new Error(
			`Failed to create valid ColumnMapping. ${errorParts.join(". ")}`,
		);
	}

	// validateColumnMapping ensures that the result is a valid ColumnMapping
	return result as ColumnMapping<TMetadata>;
}
