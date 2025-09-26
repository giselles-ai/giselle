import { isRunningGeneration } from "@giselle-sdk/giselle";
import { giselleEngine } from "@/app/giselle-engine";
import { inngest } from "./client";

export const generateContent = inngest.createFunction(
	{ id: "giselle.generate-content" },
	{ event: "giselle/generate-content" },
	async ({ event, logger }) => {
		const generation = await giselleEngine.getGeneration(
			event.data.generationId,
			true,
		);
		if (!isRunningGeneration(generation)) {
			return {
				message: `Generation ${event.data.generationId} is not running.`,
			};
		}
		await giselleEngine.generateContent({ generation, logger });
		return { message: `generation complete!: ${event.data.generationId}` };
	},
);
