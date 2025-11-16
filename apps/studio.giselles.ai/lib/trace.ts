import { traceGeneration } from "@giselles-ai/langfuse";
import type {
	CompletedGeneration,
	FailedGeneration,
	OutputFileBlob,
} from "@giselles-ai/protocol";
import type { ModelMessage, ProviderMetadata } from "ai";
import type { CurrentTeam } from "@/services/teams";

type TeamForPlan = Pick<CurrentTeam, "id" | "activeSubscriptionId" | "plan">;

export async function traceGenerationForTeam(args: {
	generation: CompletedGeneration | FailedGeneration;
	inputMessages: ModelMessage[];
	outputFileBlobs?: OutputFileBlob[];
	sessionId?: string;
	userId: string;
	team: TeamForPlan;
	providerMetadata?: ProviderMetadata;
	requestId?: string;
}) {
	const teamPlan = args.team.plan;
	const planTag = `plan:${teamPlan}`;

	await traceGeneration({
		generation: args.generation,
		outputFileBlobs: args.outputFileBlobs,
		inputMessages: args.inputMessages,
		userId: args.userId,
		tags: [planTag],
		metadata: {
			generationId: args.generation.id,
			teamPlan,
			userId: args.userId,
			subscriptionId: args.team.activeSubscriptionId ?? "",
			providerMetadata: args.providerMetadata,
			requestId: args.requestId,
			workspaceId: args.generation.context.origin.workspaceId,
		},
		sessionId: args.sessionId,
	});
}
