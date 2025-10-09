import type { EmbeddingProfileId } from "@giselle-sdk/data-type";
import { traceEmbedding } from "@giselle-sdk/langfuse";
import type { EmbeddingCompleteCallback } from "@giselle-sdk/rag";
import type {
	DocumentVectorStoreId,
	DocumentVectorStoreSourceId,
} from "@giselles-ai/types";
import { isProPlan, type TeamWithSubscription } from "@/services/teams";
import type { DocumentIngestTrigger } from "./triggers";

type DocumentEmbeddingResource = {
	storeId: DocumentVectorStoreId;
	sourceId: DocumentVectorStoreSourceId;
	embeddingProfileId: EmbeddingProfileId;
};

interface IngestEmbeddingCallbackMetadata {
	team: TeamWithSubscription;
	trigger: DocumentIngestTrigger;
	resource: DocumentEmbeddingResource;
}

export function createDocumentIngestEmbeddingCallback(
	metadata: IngestEmbeddingCallbackMetadata,
): EmbeddingCompleteCallback {
	return async (metrics) => {
		const { team, trigger, resource } = metadata;
		const isPro = isProPlan(team);
		const planTag = isPro ? "plan:pro" : "plan:free";
		const teamTypeTag = `teamType:${team.type}`;
		const baseTags = [
			planTag,
			teamTypeTag,
			"embedding-purpose:ingestion",
			"resource:document-vector-store",
		];

		const userId = trigger.type === "manual" ? trigger.userId : "cron";

		await traceEmbedding({
			metrics,
			userId,
			sessionId: trigger.id,
			tags: baseTags,
			metadata: {
				teamId: team.id,
				teamDbId: team.dbId,
				teamType: team.type,
				isProPlan: isPro,
				subscriptionId: team.activeSubscriptionId ?? "",
				triggerType: trigger.type,
				triggerId: trigger.id,
				resourceProvider: "document",
				documentVectorStoreId: resource.storeId,
				documentVectorStoreSourceId: resource.sourceId,
				embeddingProfileId: resource.embeddingProfileId,
			},
		});
	};
}
