import type { GitHubActionCommandId } from "@giselle-sdk/flow";
import { z } from "zod/v4";

const GitHubActionCommandUnconfiguredState = z.object({
	status: z.literal("unconfigured"),
});
export type GitHubActionCommandUnconfiguredState = z.infer<
	typeof GitHubActionCommandUnconfiguredState
>;

const GitHubActionCommandConfiguredState = z.object({
	status: z.literal("configured"),
	commandId: z.custom<GitHubActionCommandId>(),
	installationId: z.number(),
	repositoryNodeId: z.string(),
});
export type GitHubActionCommandConfiguredState = z.infer<
	typeof GitHubActionCommandConfiguredState
>;

const GitHubActionCommandData = z.object({
	provider: z.literal("github"),
	state: z.discriminatedUnion("status", [
		GitHubActionCommandUnconfiguredState,
		GitHubActionCommandConfiguredState,
	]),
});
export type GitHubActionCommandData = z.infer<typeof GitHubActionCommandData>;

export const ActionContent = z.object({
	type: z.literal("action"),
	command: GitHubActionCommandData,
});
export type ActionContent = z.infer<typeof ActionContent>;

export const ActionContentReference = z.object({
	type: ActionContent.shape.type,
});
export type ActionContentReference = z.infer<typeof ActionContentReference>;
