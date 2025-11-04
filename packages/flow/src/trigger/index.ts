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

/** @deprecated We want to unify s"\@giselle-ai/flow" into @giselle-ai/giselle, so update packages/giselle/src/engine/triggers/trigger-providers/index.ts and write the same values here as well */
export type TriggerProvider =
	| typeof manualProvider
	| typeof githubProvider
	| typeof appEntryProvider;
/** @deprecated We want to unify "@giselle-ai/flow" into "@giselle-ai/giselle", so update packages/giselle/src/engine/triggers/trigger-providers/index.ts and write the same values here as well */
export const triggerProviders = [
	manualProvider,
	githubProvider,
	appEntryProvider,
] as const;
