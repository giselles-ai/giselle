import type { WorkspaceId } from "@giselle-sdk/data-type";
import type {
	GitHubAppUserAuth,
	GitHubInstallationAppAuth,
	GitHubTokenAuth,
} from "@giselle-sdk/github-client";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";
import type { UsageLimits } from "@giselle-sdk/usage-limits";
import type { Storage } from "unstorage";

export interface GiselleEngineContext {
	storage: Storage;
	sampleAppWorkspaceId?: WorkspaceId;
	llmProviders: LanguageModelProvider[];
	integrationConfigs?: GiselleIntegrationConfig[];
	onConsumeAgentTime?: ConsumeAgentTimeCallback;
	fetchUsageLimitsFn?: FetchUsageLimitsFn;
	telemetry?: {
		isEnabled?: boolean;
		waitForFlushFn?: () => Promise<unknown>;
	};
}

export interface GitHubIntegrationConfig {
	provider: "github";
	auth: GitHubTokenAuth | Omit<GitHubInstallationAppAuth, "installationId">;
}

export type GiselleIntegrationConfig = GitHubIntegrationConfig;
export type ConsumeAgentTimeCallback = (
	workspaceId: WorkspaceId,
	startedAt: number,
	endedAt: number,
	totalDurationMs: number,
) => Promise<void>;

export type FetchUsageLimitsFn = (
	workspaceId: WorkspaceId,
) => Promise<UsageLimits>;

export interface GiselleEngineConfig {
	storage: Storage;
	sampleAppWorkspaceId?: WorkspaceId;
	llmProviders?: LanguageModelProvider[];
	integrationConfigs?: GiselleIntegrationConfig[];
	onConsumeAgentTime?: ConsumeAgentTimeCallback;
	telemetry?: {
		isEnabled?: boolean;
		waitForFlushFn?: () => Promise<unknown>;
	};
	fetchUsageLimitsFn?: FetchUsageLimitsFn;
}
