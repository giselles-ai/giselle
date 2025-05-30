import { z } from "zod/v4";
import { DEFAULT_COLUMN_CONFIG } from "./config";
import type { MetadataDefinitionResult } from "./metadata";
import { ChunkWithEmbedding } from "./types";

// StorageSchemaConfig type based on defineStorageSchema return type
// TMetadata: Zod schema that produces DocumentMetadata-compatible output
// TChunk: Zod schema that produces ChunkWithEmbedding-compatible output
// Note: We use flexible constraints here due to Zod's complex type system,
// but runtime validation ensures type safety through schema validation
export type StorageSchemaConfig<
	TMetadata extends z.ZodTypeAny,
	TChunk extends z.ZodTypeAny,
> = {
	readonly name: string;
	readonly documentMetadataSchema: TMetadata;
	readonly chunkSchema: TChunk;
	readonly columnMapping: Record<string, string>;
	readonly documentKey: string;
	readonly sourceKeys: readonly string[];
	readonly embeddingColumnName: string;
	readonly chunkContentColumnName: string;
	readonly chunkIndexColumnName: string;
	createMetadataDefinition(): MetadataDefinitionResult<z.infer<TMetadata> & { type: string }>;
};

// prevent type key from being used as a column name
type DisallowTypeKey<S extends z.ZodRawShape> = "type" extends keyof S
	? never
	: object;

/**
 * Usage examples
 *
 * Simple case (automatic snake_case mapping):
 * ```typescript
		export const GitHubBlobStorage = defineStorageSchema(
			"github-blob",
			z.object({
				repoId: z.string(),
				branch: z.string(),
				path: z.string(),
				fileSha: z.string(),      // maps to "file_sha"
				nodeId: z.string(),       // maps to "node_id"
				commitSha: z.string(),    // maps to "commit_sha"
			}),
			{
				documentKey: "fileSha",   // unique document identifier
				sourceKeys: ["repoId", "branch"],  // source scope identifiers
			}
		);
 * ```
 *
 * Custom mapping (when default doesn't work):
 * ```typescript
		export const GitHubBlobStorage = defineStorageSchema(
			"github-blob",
			z.object({
				repoId: z.string(),
				branch: z.string(),
				path: z.string(),
				fileSha: z.string(),
				nodeId: z.string(),
				commitSha: z.string(),
			}),
			{
				documentKey: "fileSha",
				sourceKeys: ["repoId", "branch"],
				embeddingColumnName: "vector_embedding", // custom embedding column name
				chunkContentColumnName: "text_content", // custom chunk content column name
				chunkIndexColumnName: "sequence_number", // custom chunk index column name
				columnMapping: {
					path: "file_path",        // custom mapping
					fileSha: "file_sha",
					nodeId: "node_id",
					commitSha: "commit_sha",
				}
			}
		);
 * ```
 *
 * Export types for convenience:
 * ```typescript
		export type GitHubBlobMetadata = MetadataOf<typeof GitHubBlobStorage>;
		export type GitHubBlobChunk = ChunkOf<typeof GitHubBlobStorage>;
 * ```
*/

export function defineStorageSchema<
	Name extends string,
	Extra extends z.ZodRawShape,
>(
	name: Name,
	metadataSchema: z.ZodObject<Extra> & DisallowTypeKey<Extra>,
	config: {
		documentKey: keyof Extra & string;
		sourceKeys: (keyof Extra & string)[];
		columnMapping?: Record<keyof Extra & string, string>;
		embeddingColumnName?: string;
		chunkContentColumnName?: string;
		chunkIndexColumnName?: string;
	},
) {
	const typeSchema = z.object({ type: z.literal(name) }).strict();
	const extraStrict = metadataSchema.strict();

	const documentMetadataSchema = z.intersection(typeSchema, extraStrict);
	const chunkSchema = z.intersection(ChunkWithEmbedding, extraStrict);

	const finalColumnMapping =
		config.columnMapping ?? createDefaultColumnMapping(metadataSchema);

	type InferredMetadata = z.infer<typeof documentMetadataSchema>;

	const schema: StorageSchemaConfig<
		typeof documentMetadataSchema,
		typeof chunkSchema
	> = {
		name,
		documentMetadataSchema,
		chunkSchema,
		columnMapping: finalColumnMapping,
		documentKey: config.documentKey,
		sourceKeys: config.sourceKeys,
		embeddingColumnName:
			config.embeddingColumnName ?? DEFAULT_COLUMN_CONFIG.embedding,
		chunkContentColumnName:
			config.chunkContentColumnName ?? DEFAULT_COLUMN_CONFIG.chunkContent,
		chunkIndexColumnName:
			config.chunkIndexColumnName ?? DEFAULT_COLUMN_CONFIG.chunkIndex,
		createMetadataDefinition(): MetadataDefinitionResult<InferredMetadata & { type: string }> {
			return {
				type: name as InferredMetadata["type"],
				selectColumns: Object.values(finalColumnMapping),
				transformToMetadata: (
					row: Record<string, unknown>,
				): InferredMetadata & { type: string } => {
					// Extract metadata fields using column mapping
					const metadataData: Record<string, unknown> = {
						type: name,
					};
					for (const [logicalName, dbColumn] of Object.entries(
						finalColumnMapping,
					)) {
						metadataData[logicalName] = row[dbColumn];
					}

					// Validate and return metadata
					return documentMetadataSchema.parse(metadataData) as InferredMetadata & { type: string };
				},
			};
		},
	};

	return schema;
}

export type MetadataOf<T extends { documentMetadataSchema: z.ZodTypeAny }> =
	z.infer<T["documentMetadataSchema"]>;
export type ChunkOf<T extends { chunkSchema: z.ZodTypeAny }> = z.infer<
	T["chunkSchema"]
>;

// Helper function to convert camelCase to snake_case
function camelToSnakeCase(str: string): string {
	return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// Create default column mapping (camelCase -> snake_case)
function createDefaultColumnMapping<T extends z.ZodRawShape>(
	schema: z.ZodObject<T>,
): Record<keyof T & string, string> {
	const mapping: Record<string, string> = {};
	const shape = schema.shape;

	for (const key in shape) {
		mapping[key] = camelToSnakeCase(key);
	}

	return mapping as Record<keyof T & string, string>;
}
