import type { EmbeddingProfileId, WorkspaceId } from "@giselles-ai/protocol";

import type { DocumentVectorStoreId } from "@/packages/types";

export interface DocumentVectorStoreQueryContext {
	provider: "document";
	workspaceId: WorkspaceId;
	documentVectorStoreId: DocumentVectorStoreId;
	embeddingProfileId: EmbeddingProfileId;
}
