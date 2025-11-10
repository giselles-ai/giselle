import { traceEmbedding } from "@giselles-ai/langfuse";
import type { EmbeddingProfileId } from "@giselles-ai/protocol";
import type { EmbeddingCompleteCallback } from "@giselles-ai/rag";
import type {
	DocumentVectorStoreId,
	DocumentVectorStoreSourceId,
} from "@giselles-ai/types";
import { isProPlan, type TeamWithSubscription } from "@/services/teams";

export type DocumentIngestTrigger =
	| { type: "manual"; userId: string }
	| { type: "cron"; userId?: string };

interface DocumentIngestEmbeddingMetadata {
	team: TeamWithSubscription;
	documentVectorStore: {
		id: DocumentVectorStoreId;
		dbId: number;
	};
	source: {
		id: DocumentVectorStoreSourceId;
		dbId: number;
		fileName: string;
	};
	trigger: DocumentIngestTrigger;
	embeddingProfileId: EmbeddingProfileId;
}

export function createDocumentIngestEmbeddingCallback(
	args: DocumentIngestEmbeddingMetadata,
): EmbeddingCompleteCallback {
	return async (metrics) => {
		const isPro = isProPlan(args.team);
		const planTag = isPro ? "plan:pro" : "plan:free";
		const teamTypeTag = `teamType:${args.team.type}`;
		const userId =
			args.trigger.type === "manual"
				? args.trigger.userId
				: (args.trigger.userId ?? "cron");

		try {
			await traceEmbedding({
				metrics,
				userId,
				sessionId: args.source.id,
				tags: [planTag, teamTypeTag, "embedding-purpose:ingestion"],
				metadata: {
					teamId: args.team.id,
					teamDbId: args.team.dbId,
					isProPlan: isPro,
					teamType: args.team.type,
					teamPlan: args.team.plan,
					subscriptionId: args.team.activeSubscriptionId ?? "",
					userId,
					triggerType: args.trigger.type,
					documentVectorStoreId: args.documentVectorStore.id,
					documentVectorStoreDbId: args.documentVectorStore.dbId,
					documentVectorStoreSourceId: args.source.id,
					documentVectorStoreSourceDbId: args.source.dbId,
					documentFileName: args.source.fileName,
					embeddingProfileId: args.embeddingProfileId,
				},
			});
		} catch (error) {
			console.error("Failed to emit document ingest telemetry:", {
				error: error instanceof Error ? error.message : String(error),
				sourceId: args.source.id,
			});
		}
	};
}
