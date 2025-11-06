import { githubActionOptions } from "./github";

export * from "./github";

export const actionRegistry = [
	{
		provider: "github",
		label: "GitHub Action",
		actionOptions: githubActionOptions,
	},
] as const;

export type ActionProvider = (typeof actionRegistry)[number]["provider"];

export function getEntry(actionProvider: ActionProvider) {
	return actionRegistry.find((entry) => entry.provider === actionProvider);
}
