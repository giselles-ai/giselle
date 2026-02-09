import type { DataStoreId } from "@giselles-ai/protocol";
import { and, eq } from "drizzle-orm";
import {
	dataStores,
	db,
	documentVectorStores,
	githubRepositoryIndex,
} from "@/db";
import {
	isOfficialDocumentVectorStore,
	isOfficialGitHubRepositoryIndex,
	officialVectorStoreConfig,
} from "@/lib/vector-stores/official-config";
import type { DocumentVectorStoreId } from "@/packages/types";

export async function isDataStoreOwnedByTeam(
	dataStoreId: DataStoreId,
	teamDbId: number,
): Promise<boolean> {
	const [row] = await db
		.select({ id: dataStores.id })
		.from(dataStores)
		.where(
			and(eq(dataStores.id, dataStoreId), eq(dataStores.teamDbId, teamDbId)),
		);
	return row !== undefined;
}

export async function isGitHubRepositoryIndexOwnedByTeam(
	owner: string,
	repo: string,
	teamDbId: number,
): Promise<boolean> {
	const [row] = await db
		.select({ id: githubRepositoryIndex.id })
		.from(githubRepositoryIndex)
		.where(
			and(
				eq(githubRepositoryIndex.owner, owner),
				eq(githubRepositoryIndex.repo, repo),
				eq(githubRepositoryIndex.teamDbId, teamDbId),
			),
		);
	if (row !== undefined) return true;

	// Allow official GitHub repository indexes
	if (officialVectorStoreConfig.teamDbId !== null) {
		const [officialRow] = await db
			.select({ id: githubRepositoryIndex.id })
			.from(githubRepositoryIndex)
			.where(
				and(
					eq(githubRepositoryIndex.owner, owner),
					eq(githubRepositoryIndex.repo, repo),
					eq(
						githubRepositoryIndex.teamDbId,
						officialVectorStoreConfig.teamDbId,
					),
				),
			);
		if (
			officialRow !== undefined &&
			isOfficialGitHubRepositoryIndex(officialRow.id)
		) {
			return true;
		}
	}

	return false;
}

export async function isDocumentVectorStoreOwnedByTeam(
	documentVectorStoreId: DocumentVectorStoreId,
	teamDbId: number,
): Promise<boolean> {
	const [row] = await db
		.select({ id: documentVectorStores.id })
		.from(documentVectorStores)
		.where(
			and(
				eq(documentVectorStores.id, documentVectorStoreId),
				eq(documentVectorStores.teamDbId, teamDbId),
			),
		);
	if (row !== undefined) return true;

	// Allow official document vector stores
	if (isOfficialDocumentVectorStore(documentVectorStoreId)) {
		return true;
	}

	return false;
}
