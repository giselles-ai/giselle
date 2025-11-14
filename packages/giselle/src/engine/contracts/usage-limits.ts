import type { Tier } from "@giselles-ai/language-model";
import type { WorkspaceId } from "@giselles-ai/protocol";

export interface UsageLimits {
	featureTier: Tier;
	resourceLimits: {
		agentTime: {
			limit: number; // in milliseconds
			used: number; // in milliseconds
		};
	};
}

export type ConsumeAgentTimeCallback = (
	workspaceId: WorkspaceId,
	startedAt: number,
	endedAt: number,
	totalDurationMs: number,
) => Promise<void>;

export type FetchUsageLimitsFn = (
	workspaceId: WorkspaceId,
) => Promise<UsageLimits>;
