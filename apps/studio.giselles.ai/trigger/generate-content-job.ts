import { GenerationId, isRunningGeneration } from "@giselles-ai/protocol";
import { logger, schemaTask as schemaJob } from "@trigger.dev/sdk";
import { z } from "zod/v4";
import { giselleEngine } from "@/app/giselle-engine";

export const generateContentJob = schemaJob({
	id: "generate-content",
	schema: z.object({
		generationId: GenerationId.schema,
		requestId: z.string().optional(),
		userId: z.string(),
		team: z.object({
			id: z.string<`tm_${string}`>(),
			subscriptionId: z.string().nullable(),
			plan: z.enum(["free", "pro", "team", "enterprise", "internal"]),
		}),
	}),
	run: async (payload) => {
		const generation = await giselleEngine.getGeneration(payload.generationId);
		if (!isRunningGeneration(generation)) {
			return {
				message: `Generation ${payload.generationId} is not running.`,
			};
		}
		await giselleEngine.generateContent({
			generation,
			logger,
			metadata: {
				requestId: payload.requestId,
				userId: payload.userId,
				team: payload.team,
			},
		});
	},
});
