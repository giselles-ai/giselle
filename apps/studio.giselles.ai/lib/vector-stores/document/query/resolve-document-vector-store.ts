import { and, eq } from "drizzle-orm";
import { agents, db, documentVectorStores, teams } from "@/db";
import {
	isOfficialDocumentVectorStore,
	officialVectorStoreConfig,
} from "../../official-config";
import type { DocumentVectorStoreQueryContext } from "./context";

export async function resolveDocumentVectorStoreDbId(
	context: DocumentVectorStoreQueryContext,
): Promise<number> {
	const { workspaceId, documentVectorStoreId } = context;
	if (!workspaceId || workspaceId.trim().length === 0) {
		throw new Error("Workspace ID is required");
	}
	if (!documentVectorStoreId || documentVectorStoreId.trim().length === 0) {
		throw new Error("Document vector store ID is required");
	}

	// Official Vector Store bypass: if the store is in the official list,
	// verify it belongs to the official team and return its dbId
	if (
		officialVectorStoreConfig.teamDbId !== null &&
		isOfficialDocumentVectorStore(documentVectorStoreId)
	) {
		const officialStoreRecords = await db
			.select({ dbId: documentVectorStores.dbId })
			.from(documentVectorStores)
			.where(
				and(
					eq(documentVectorStores.teamDbId, officialVectorStoreConfig.teamDbId),
					eq(documentVectorStores.id, documentVectorStoreId),
				),
			)
			.limit(1);

		if (officialStoreRecords.length > 0) {
			return officialStoreRecords[0].dbId;
		}
		// If not found in official team, fall through to normal authorization
	}

	// Standard authorization: resolve workspace -> team -> store
	const teamRecords = await db
		.select({ dbId: teams.dbId })
		.from(teams)
		.innerJoin(agents, eq(agents.teamDbId, teams.dbId))
		.where(eq(agents.workspaceId, workspaceId))
		.limit(1);

	if (teamRecords.length === 0) {
		throw new Error("Team not found");
	}

	const teamDbId = teamRecords[0].dbId;

	const storeRecords = await db
		.select({ dbId: documentVectorStores.dbId })
		.from(documentVectorStores)
		.where(
			and(
				eq(documentVectorStores.teamDbId, teamDbId),
				eq(documentVectorStores.id, documentVectorStoreId),
			),
		)
		.limit(1);

	if (storeRecords.length === 0) {
		throw new Error("Document vector store not found");
	}

	return storeRecords[0].dbId;
}
