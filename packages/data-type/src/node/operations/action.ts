import { z } from "zod";

const GitHubActionProviderAuthUnauthenticated = z.object({
	state: z.literal("unauthenticated"),
});
const GitHubActionProviderAuthAuthenticated = z.object({
	state: z.literal("authenticated"),
	installtionId: z.number(),
});
const GitHubActionProviderAuth = z.discriminatedUnion("state", [
	GitHubActionProviderAuthUnauthenticated,
	GitHubActionProviderAuthAuthenticated,
]);

export const GitHubActionProvider = z.object({
	type: z.literal("github"),
	actionId: z.string(),
	auth: GitHubActionProviderAuth,
});
export type GitHubActionProvider = z.infer<typeof GitHubActionProvider>;

export const ActionProvider = z.discriminatedUnion("type", [
	GitHubActionProvider,
]);
export type ActionProvider = z.infer<typeof ActionProvider>;

export const ActionProviderLike = z.object({
	type: z.string(),
	actionId: z.string(),
});
export type ActionProviderLike = z.infer<typeof ActionProviderLike>;

export const ActionContent = z.object({
	type: z.literal("action"),
	provider: ActionProviderLike,
});
export type ActionContent = z.infer<typeof ActionContent>;

export const ActionContentReference = z.object({
	type: z.literal("action"),
});
export type ActionContentReference = z.infer<typeof ActionContentReference>;
