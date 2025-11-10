import { githubActions } from "./github";

export * from "./github";

export const actionRegistry = [
	{
		provider: "github",
		label: "GitHub Action",
		actions: githubActions,
	},
] as const;

export type ActionProvider = (typeof actionRegistry)[number]["provider"];

export function getEntry(actionProvider: ActionProvider) {
	return actionRegistry.find((entry) => entry.provider === actionProvider);
}

export function isActionProvider(provider: string): provider is ActionProvider {
	return actionRegistry.some((entry) => entry.provider === provider);
}
