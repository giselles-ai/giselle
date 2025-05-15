import { z } from "zod";
import type { ActionBase } from "../base";

export const provider = "fetch" as const;

export interface FetchAction extends ActionBase {
	provider: typeof provider;
}

export const fetchWebsitesAction = {
	provider,
	command: {
		id: "fetch.websites",
		label: "Fetch Websites",
		parameters: z.object({
			urls: z.array(z.string().url()),
			formats: z.array(z.enum(["markdown", "links", "html"])),
		}),
	},
} as const satisfies FetchAction;

export const actions = [fetchWebsitesAction] as const;

export type ActionCommandId = (typeof actions)[number]["command"]["id"];

export function actionIdToLabel(triggerId: ActionCommandId) {
	switch (triggerId) {
		case "fetch.websites":
			return fetchWebsitesAction.command.label;
		default: {
			const exhaustiveCheck: never = triggerId;
			throw new Error(`Unknown trigger ID: ${exhaustiveCheck}`);
		}
	}
}
