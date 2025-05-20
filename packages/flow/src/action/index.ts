import { actions as githubActions, provider as githubProvider } from "./github";

export {
	actions as githubActions,
	provider as githubProvider,
	type ActionCommandId as GitHubActionCommandId,
	actionIdToLabel as githubActionIdToLabel,
	type GitHubAction,
} from "./github";

export type ActionProvider = typeof githubProvider;
export const actionProviders = [githubProvider];
