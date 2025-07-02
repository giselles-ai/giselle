import {
	provider as githubProvider,
	triggers as githubTriggers,
} from "./github";
import {
	provider as manualProvider,
	triggers as manualTriggers,
} from "./manual";

export {
	type TriggerEventId as GitHubTriggerEventId,
	triggerIdToLabel as githubTriggerIdToLabel,
	triggers as githubTriggers,
} from "./github";
export { triggers as manualTriggers } from "./manual";

export type TriggerProvider = typeof manualProvider | typeof githubProvider;
export const triggerProviders = [manualProvider, githubProvider] as const;
