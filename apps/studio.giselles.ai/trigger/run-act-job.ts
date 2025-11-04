import { ActId } from "@giselle-ai/giselle";
import { logger, schemaTask as schemaJob } from "@trigger.dev/sdk";
import z from "zod/v4";
import { giselleEngine } from "@/app/giselle-engine";

export const runActJob = schemaJob({
	id: "run-act-job",
	schema: z.object({
		actId: ActId.schema,
		requestId: z.string().optional(),
		userId: z.string(),
		team: z.object({
			id: z.string<`tm_${string}`>(),
			type: z.enum(["customer", "internal"]),
			subscriptionId: z.string().nullable(),
		}),
	}),
	run: async (payload) => {
		await giselleEngine.runAct({
			actId: payload.actId,
			logger,
			metadata: {
				userId: payload.userId,
				team: payload.team,
				requestId: payload.requestId,
			},
		});
	},
});
