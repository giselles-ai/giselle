import type { EmbeddingProfileId, WorkspaceId } from "@giselle-ai/data-type";

import type { DocumentVectorStoreId } from "@/packages/types";

export interface DocumentVectorStoreQueryContext {
	provider: "document";
	workspaceId: WorkspaceId;
	documentVectorStoreId: DocumentVectorStoreId;
	embeddingProfileId: EmbeddingProfileId;
}
