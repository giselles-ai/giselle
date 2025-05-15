import { actions as fetchActions, provider as fetchProvider } from "./fetch";
import { actions as githubActions, provider as githubProvider } from "./github";

export {
	actions as githubActions,
	provider as githubProvider,
	type ActionCommandId as GitHubActionCommandId,
	actionIdToLabel as githubActionIdToLabel,
} from "./github";

export {
	actions as fetchActions,
	provider as fetchProvider,
	type ActionCommandId as FetchActionCommandId,
	actionIdToLabel as fetchActionIdToLabel,
} from "./fetch";

export const actions = [...githubActions, ...fetchActions];
export type ActionProvider = typeof githubProvider | typeof fetchProvider;
export const actionProviders = [githubProvider, fetchProvider];
