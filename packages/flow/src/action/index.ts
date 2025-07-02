import { actions as githubActions, provider as githubProvider } from "./github";
import {
	actions as webSearchActions,
	provider as webSearchProvider,
} from "./web-search";

export {
	type ActionCommandId as GitHubActionCommandId,
	actionIdToLabel as githubActionIdToLabel,
	actions as githubActions,
	type GitHubAction,
	provider as githubProvider,
} from "./github";

export {
	type ActionCommandId as WebSearchActionCommandId,
	actionIdToLabel as webSearchActionIdToLabel,
	actions as webSearchActions,
	provider as webSearchProvider,
	type WebSearchAction,
} from "./web-search";

export type ActionProvider = typeof githubProvider | typeof webSearchProvider;
export const actionProviders = [githubProvider, webSearchProvider];
