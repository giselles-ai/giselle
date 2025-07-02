import { provider as githubProvider } from "./github";
import { provider as manualProvider } from "./manual";

export {
	type TriggerEventId as GitHubTriggerEventId,
	triggerIdToLabel as githubTriggerIdToLabel,
	triggers as githubTriggers,
} from "./github";
export { triggers as manualTriggers } from "./manual";

export type TriggerProvider = typeof manualProvider | typeof githubProvider;
export const triggerProviders = [manualProvider, githubProvider] as const;
