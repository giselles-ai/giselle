/**
 * Configuration for publicly accessible (official) Vector Stores.
 * These are provided by Giselle and available to all users as read-only.
 */

import type { DocumentVectorStoreId } from "@/packages/types";

function parseIntOrNull(value: string | undefined): number | null {
	if (!value) return null;
	const parsed = parseInt(value, 10);
	return Number.isNaN(parsed) ? null : parsed;
}

function parseDocumentVectorStoreIds(
	value: string | undefined,
): DocumentVectorStoreId[] {
	if (!value) return [];

	return value
		.split(",")
		.map((id) => id.trim())
		.filter((id): id is DocumentVectorStoreId => id.startsWith("dvs_"));
}

export const publicVectorStoreConfig = {
	/** Team DB ID that owns the official Vector Stores */
	teamDbId: parseIntOrNull(process.env.PUBLIC_VECTOR_STORE_TEAM_DB_ID),

	/** Document Vector Store IDs that are publicly accessible */
	documentStoreIds: parseDocumentVectorStoreIds(
		process.env.PUBLIC_DOCUMENT_VECTOR_STORE_IDS,
	),
} as const;

/** Check if a Document Vector Store is publicly accessible */
export function isPublicDocumentVectorStore(
	id: DocumentVectorStoreId,
): boolean {
	return publicVectorStoreConfig.documentStoreIds.includes(id);
}
