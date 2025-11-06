import { z } from "zod/v4";
import type { GitHubActionCommandId } from "../../action";

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

const GitHubActionCommandReconfiguringState = z.object({
	status: z.literal("reconfiguring"),
	commandId: z.custom<GitHubActionCommandId>(),
});
export type GitHubActionCommandReconfiguringState = z.infer<
	typeof GitHubActionCommandReconfiguringState
>;

const GitHubActionCommandData = z.object({
	provider: z.literal("github"),
	state: z.discriminatedUnion("status", [
		GitHubActionCommandUnconfiguredState,
		GitHubActionCommandConfiguredState,
		GitHubActionCommandReconfiguringState,
	]),
});
export type GitHubActionCommandData = z.infer<typeof GitHubActionCommandData>;

const ActionCommandData = z.discriminatedUnion("provider", [
	GitHubActionCommandData,
]);
export type ActionCommandData = z.infer<typeof ActionCommandData>;

export const ActionContent = z.object({
	type: z.literal("action"),
	command: ActionCommandData,
});
export type ActionContent = z.infer<typeof ActionContent>;

export const ActionContentReference = z.object({
	type: ActionContent.shape.type,
});
export type ActionContentReference = z.infer<typeof ActionContentReference>;
