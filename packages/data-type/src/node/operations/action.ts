import type {
	FetchActionCommandId,
	GitHubActionCommandId,
} from "@giselle-sdk/flow";
import { z } from "zod";

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

const FetchActionCommandUnconfiguredState = z.object({
	status: z.literal("unconfigured"),
});
export type FetchActionCommandUnconfiguredState = z.infer<
	typeof FetchActionCommandUnconfiguredState
>;

const FetchActionCommandConfiguredState = z.object({
	status: z.literal("configured"),
	commandId: z.custom<FetchActionCommandId>(),
	urls: z.array(z.string().url()),
	urlInputMode: z.enum(["manual", "node"]),
	formats: z.array(z.enum(["markdown", "links", "html"])),
});
export type FetchActionCommandConfiguredState = z.infer<
	typeof FetchActionCommandConfiguredState
>;

const FetchActionCommandData = z.object({
	provider: z.literal("fetch"),
	state: z.discriminatedUnion("status", [
		FetchActionCommandUnconfiguredState,
		FetchActionCommandConfiguredState,
	]),
});
export type FetchActionCommandData = z.infer<typeof FetchActionCommandData>;

export const ActionContent = z.object({
	type: z.literal("action"),
	command: z.discriminatedUnion("provider", [
		GitHubActionCommandData,
		FetchActionCommandData,
	]),
});
export type ActionContent = z.infer<typeof ActionContent>;

export const ActionContentReference = z.object({
	type: ActionContent.shape.type,
});
export type ActionContentReference = z.infer<typeof ActionContentReference>;
