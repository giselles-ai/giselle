import { z } from "zod";
import type { TriggerBase } from "../base";

export const provider = "manual" as const;
export interface ManualTrigger extends TriggerBase {
	provider: typeof provider;
}

export const manualTrigger = {
	provider,
	event: {
		id: "manual",
		label: "Manual trigger",
		payloads: z.object({
			Output: z.string(),
		}),
	},
} as const satisfies ManualTrigger;

export const triggers = {
	[manualTrigger.event.id]: manualTrigger,
} as const;
