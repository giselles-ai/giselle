import type { DataStoreId } from "@giselles-ai/protocol";
import { and, eq } from "drizzle-orm";
import {
	dataStores,
	db,
	documentVectorStores,
	githubRepositoryIndex,
} from "@/db";
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
	return row !== undefined;
}

export async function isDocumentVectorStoreOwnedByTeam(
	documentVectorStoreId: string,
	teamDbId: number,
): Promise<boolean> {
	const [row] = await db
		.select({ id: documentVectorStores.id })
		.from(documentVectorStores)
		.where(
			and(
				eq(
					documentVectorStores.id,
					documentVectorStoreId as DocumentVectorStoreId,
				),
				eq(documentVectorStores.teamDbId, teamDbId),
			),
		);
	return row !== undefined;
}
