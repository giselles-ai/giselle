import { z } from "zod/v4";
import type { TriggerBase } from "../base";

export const provider = "app-entry" as const;
interface AppEntry extends TriggerBase {
	provider: typeof provider;
}

const appEntryTrigger = {
	provider,
	event: {
		id: "app-entry",
		label: "App Entry",
		payloads: z.object({
			Output: z.string(),
		}),
	},
} as const satisfies AppEntry;

export const triggers = {
	[appEntryTrigger.event.id]: appEntryTrigger,
} as const;
