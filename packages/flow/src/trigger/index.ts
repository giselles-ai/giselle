import {
	provider as githubProvider,
	triggers as githubTriggers,
} from "./github";
import {
	provider as manualProvider,
	triggers as manualTriggers,
} from "./manual";

export {
	triggers as githubTriggers,
	triggerIdToLabel as githubTriggerIdToLabel,
	type TriggerEventId as GitHubTriggerEventId,
} from "./github";
export { triggers as manualTriggers } from "./manual";

export type TriggerProvider = typeof manualProvider | typeof githubProvider;
export const triggerProviders = [manualProvider, githubProvider] as const;
