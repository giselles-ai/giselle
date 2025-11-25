import { GenerationId, isRunningGeneration } from "@giselles-ai/protocol";
import { logger, schemaTask as schemaJob } from "@trigger.dev/sdk";
import { z } from "zod/v4";
import { giselle } from "@/app/giselle";
import { GenerationMetadata } from "@/lib/generation-metadata";
import { traceGenerationForTeam } from "@/lib/trace";

export const generateContentJob = schemaJob({
	id: "generate-content",
	schema: z.object({
		generationId: GenerationId.schema,
		requestId: z.string().optional(),
		userId: z.string(),
		team: z.object({
			id: z.string<`tm_${string}`>(),
			subscriptionId: z.string().nullable(),
			activeCustomerId: z.string().nullable(),
			plan: z.enum(["free", "pro", "team", "enterprise", "internal"]),
		}),
	}),
	run: async (payload) => {
		const generation = await giselle.getGeneration(payload.generationId);
		if (!isRunningGeneration(generation)) {
			return {
				message: `Generation ${payload.generationId} is not running.`,
			};
		}
		await giselle.generateContent({
			generation,
			logger,
			metadata: {
				requestId: payload.requestId,
				userId: payload.userId,
				team: payload.team,
			},
			onComplete: async ({ generationMetadata, generation, ...events }) => {
				const parsedMetadata = GenerationMetadata.parse(generationMetadata);
				await traceGenerationForTeam({
					...events,
					generation,
					requestId: parsedMetadata.requestId,
					userId: parsedMetadata.userId,
					sessionId: generation.context.origin.taskId,
					team: {
						id: parsedMetadata.team.id,
						activeSubscriptionId: parsedMetadata.team.subscriptionId,
						plan: parsedMetadata.team.plan,
					},
				});
			},
			onError: async ({ generationMetadata, generation, ...events }) => {
				const parsedMetadata = GenerationMetadata.parse(generationMetadata);
				await traceGenerationForTeam({
					...events,
					generation,
					requestId: parsedMetadata.requestId,
					userId: parsedMetadata.userId,
					sessionId: generation.context.origin.taskId,
					team: {
						id: parsedMetadata.team.id,
						activeSubscriptionId: parsedMetadata.team.subscriptionId,
						plan: parsedMetadata.team.plan,
					},
				});
			},
		});
	},
});
