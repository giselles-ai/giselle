import { traceEmbedding } from "@giselles-ai/langfuse";
import type {
	EmbeddingCompleteCallback,
	EmbeddingMetrics,
} from "@giselles-ai/rag";
import type { TeamWithSubscription } from "@/services/teams";
import type { IngestTrigger } from "./process-repository";

type IngestMetadata = {
	team: TeamWithSubscription;
	trigger: IngestTrigger;
	resource: {
		provider: "github";
		contentType: "blob" | "pullRequest" | "issue";
		owner: string;
		repo: string;
	};
};

export function createIngestEmbeddingCallback(
	metadata: IngestMetadata,
): EmbeddingCompleteCallback {
	return async (metrics: EmbeddingMetrics) => {
		const { team, trigger, resource } = metadata;

		const planTag = `plan:${team.plan}`;
		const userId = trigger.type === "manual" ? trigger.userId : "cron";

		await traceEmbedding({
			metrics,
			userId,
			sessionId: trigger.id,
			tags: [planTag, "embedding-purpose:ingestion"],
			metadata: {
				teamId: team.id,
				teamPlan: team.plan,
				subscriptionId: team.activeSubscriptionId ?? "",
				userId,
				resourceProvider: resource.provider,
				resourceContentType: resource.contentType,
				resourceOwner: resource.owner,
				resourceRepo: resource.repo,
				triggerType: trigger.type,
			},
		});
	};
}
