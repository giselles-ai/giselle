import { GenerationId, isRunningGeneration } from "@giselles-ai/protocol";
import { logger, schemaTask as schemaJob } from "@trigger.dev/sdk";
import z from "zod/v4";
import { giselle } from "@/app/giselle";

export const executeDataQueryJob = schemaJob({
	id: "execute-data-query",
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
		await giselle.executeDataQuery(generation);
		logger.info("Data query execution finished", {
			generationId: payload.generationId,
		});
	},
});
