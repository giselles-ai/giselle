import { TaskId } from "@giselles-ai/giselle";
import { logger, schemaTask as schemaJob } from "@trigger.dev/sdk";
import z from "zod/v4";
import { giselle } from "@/app/giselle";

export const runActJob = schemaJob({
	id: "run-act-job",
	schema: z.object({
		actId: TaskId.schema,
		requestId: z.string().optional(),
		userId: z.string(),
		team: z.object({
			id: z.string<`tm_${string}`>(),
			subscriptionId: z.string().nullable(),
			plan: z.enum(["free", "pro", "team", "enterprise", "internal"]),
		}),
	}),
	run: async (payload) => {
		await giselle.runAct({
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
