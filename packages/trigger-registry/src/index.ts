import { githubEvents } from "./github";

export * from "./github";

export const triggerRegistry = [
	{
		provider: "github",
		label: "GitHub Trigger",
		events: githubEvents,
	},
] as const;

export type TriggerProvider = (typeof triggerRegistry)[number]["provider"];

export function getEntry(triggerProvider: TriggerProvider) {
	const trigger = triggerRegistry.find(
		(entry) => entry.provider === triggerProvider,
	);
	if (trigger === undefined) {
		throw new Error(`Trigger provider ${triggerProvider} not found`);
	}
	return trigger;
}

export function isTriggerProvider(
	provider: unknown,
): provider is TriggerProvider {
	return triggerRegistry.some((entry) => entry.provider === provider);
}
