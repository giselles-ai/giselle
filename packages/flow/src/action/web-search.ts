import { z } from "zod/v4";
import type { ActionBase } from "../base";

export const provider = "web-search" as const;

export interface WebSearchActionBase extends ActionBase {
	provider: typeof provider;
}

export const webSearchFetchAction = {
	provider,
	command: {
		id: "web-search.fetch",
		label: "Fetch Web Page",
		parameters: z.object({
			url: z.string().url(),
		}),
	},
} as const satisfies WebSearchActionBase;

export const actions = {
	[webSearchFetchAction.command.id]: webSearchFetchAction,
} as const;

export type WebSearchAction = typeof webSearchFetchAction;

export type ActionCommandId = keyof typeof actions;

export function actionIdToLabel(actionId: ActionCommandId) {
	switch (actionId) {
		case "web-search.fetch":
			return webSearchFetchAction.command.label;
		default: {
			const exhaustiveCheck: never = actionId;
			throw new Error(`Unknown action ID: ${exhaustiveCheck}`);
		}
	}
}
