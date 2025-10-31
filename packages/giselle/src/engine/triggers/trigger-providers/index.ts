import { provider as appEntryProvider } from "./app-entry";
import { provider as githubProvider } from "./github";
import { provider as manualProvider } from "./manual";

export { triggers as appEntries } from "./app-entry";
export {
	getGitHubDisplayLabel,
	type TriggerEventId as GitHubTriggerEventId,
	triggerIdToLabel as githubTriggerIdToLabel,
	triggers as githubTriggers,
} from "./github";
export { triggers as manualTriggers } from "./manual";

export type TriggerProvider =
	| typeof manualProvider
	| typeof githubProvider
	| typeof appEntryProvider;
export const triggerProviders = [
	manualProvider,
	githubProvider,
	appEntryProvider,
] as const;
