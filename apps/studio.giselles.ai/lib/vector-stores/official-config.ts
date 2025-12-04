/**
 * Configuration for official Vector Stores.
 * These are provided by Giselle and available to all users as read-only.
 */

import type {
	DocumentVectorStoreId,
	GitHubRepositoryIndexId,
} from "@/packages/types";

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

function parseGitHubRepositoryIndexIds(
	value: string | undefined,
): GitHubRepositoryIndexId[] {
	if (!value) return [];

	return value
		.split(",")
		.map((id) => id.trim())
		.filter((id): id is GitHubRepositoryIndexId => id.startsWith("gthbi_"));
}

export const officialVectorStoreConfig = {
	/** Team DB ID that owns the official Vector Stores */
	teamDbId: parseIntOrNull(process.env.OFFICIAL_VECTOR_STORE_TEAM_DB_ID),

	/** Document Vector Store IDs that are official */
	documentStoreIds: parseDocumentVectorStoreIds(
		process.env.OFFICIAL_DOCUMENT_VECTOR_STORE_IDS,
	),

	/** GitHub Repository Index IDs that are official */
	githubRepositoryIndexIds: parseGitHubRepositoryIndexIds(
		process.env.OFFICIAL_GITHUB_REPOSITORY_INDEX_IDS,
	),
};

/** Check if a GitHub Repository Index is official */
export function isOfficialGitHubRepositoryIndex(
	id: GitHubRepositoryIndexId,
): boolean {
  return officialVectorStoreConfig.githubRepositoryIndexIds.includes(id);
}

/** Check if a Document Vector Store is official */
export function isOfficialDocumentVectorStore(id: DocumentVectorStoreId) {
	return officialVectorStoreConfig.documentStoreIds.includes(id);
}
