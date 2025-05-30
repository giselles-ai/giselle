// Metadata field mapping utilities
import type { DocumentMetadata } from "./types";

// Helper type for metadata definition result with DocumentMetadata compatibility
// Used by the new defineStorageSchema API
export type MetadataDefinitionResult<TMetadata extends DocumentMetadata> = {
	readonly type: TMetadata["type"];
	readonly selectColumns: readonly string[];
	readonly transformToMetadata: (row: Record<string, unknown>) => TMetadata;
};
