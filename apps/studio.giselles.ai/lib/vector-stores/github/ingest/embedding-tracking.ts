import { traceEmbedding } from "@giselles-ai/langfuse";
import type {
	EmbeddingCompleteCallback,
	EmbeddingMetrics,
} from "@giselles-ai/rag";
import { isProPlan, type TeamWithSubscription } from "@/services/teams";
import type { IngestTrigger } from "./process-repository";

type IngestMetadata = {
	team: TeamWithSubscription;
	trigger: IngestTrigger;
	resource: {
		provider: "github";
		contentType: "blob" | "pullRequest";
		owner: string;
		repo: string;
	};
};

export function createIngestEmbeddingCallback(
	metadata: IngestMetadata,
): EmbeddingCompleteCallback {
	return async (metrics: EmbeddingMetrics) => {
		const { team, trigger, resource } = metadata;

		const isPro = isProPlan(team);
		const planTag = isPro ? "plan:pro" : "plan:free";
		const teamTypeTag = `teamType:${team.type}`;
		const userId = trigger.type === "manual" ? trigger.userId : "cron";

		await traceEmbedding({
			metrics,
			userId,
			sessionId: trigger.id,
			tags: [planTag, teamTypeTag, "embedding-purpose:ingestion"],
			metadata: {
				teamId: team.id,
				isProPlan: isPro,
				teamType: team.type,
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
