import type { UsageItem, WorkspaceId } from "@giselle-sdk/data-type";
import type {
	GitHubInstallationAppAuth,
	GitHubPersonalAccessTokenAuth,
} from "@giselle-sdk/github-tool";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";
import type { UsageLimits } from "@giselle-sdk/usage-limits";
import type { Storage } from "unstorage";
import type { Vault } from "./vault";

export interface GiselleEngineContext {
	storage: Storage;
	sampleAppWorkspaceId?: WorkspaceId;
	llmProviders: LanguageModelProvider[];
	integrationConfigs?: {
		github?: GitHubIntegrationConfig;
	};
	onConsumeAgentTime?: ConsumeAgentTimeCallback;
	fetchUsageLimitsFn?: FetchUsageLimitsFn;
	telemetry?: {
		isEnabled?: boolean;
		waitForFlushFn?: () => Promise<unknown>;
	};
	vault?: Vault;
	onUsageResolved?: ModelUsageResolvedCallback;
}

interface GitHubInstalltionAppAuthResolver {
	installationIdForRepo: (repositoryNodeId: string) => Promise<number> | number;
	installtionIds: () => Promise<number[]> | number[];
}
export interface GitHubIntegrationConfig {
	auth:
		| GitHubPersonalAccessTokenAuth
		| (Omit<GitHubInstallationAppAuth, "installationId"> & {
				resolver: GitHubInstalltionAppAuthResolver;
		  });
	authV2: {
		appId: string;
		privateKey: string;
		clientId: string;
		clientSecret: string;
		webhookSecret: string;
	};
}

export type GiselleIntegrationConfig = {
	github?: GitHubIntegrationConfig;
};
export type ConsumeAgentTimeCallback = (
	workspaceId: WorkspaceId,
	startedAt: number,
	endedAt: number,
	totalDurationMs: number,
) => Promise<void>;

export type FetchUsageLimitsFn = (
	workspaceId: WorkspaceId,
) => Promise<UsageLimits>;

export type ModelUsageResolvedCallback = (params: {
	workspaceId: WorkspaceId;
	model: string;
	provider: string;
	endedAt: Date;
	usageItems: UsageItem[];
}) => Promise<void>;

export interface GiselleEngineConfig {
	storage: Storage;
	sampleAppWorkspaceId?: WorkspaceId;
	llmProviders?: LanguageModelProvider[];
	integrationConfigs?: GiselleIntegrationConfig;
	onConsumeAgentTime?: ConsumeAgentTimeCallback;
	telemetry?: {
		isEnabled?: boolean;
		waitForFlushFn?: () => Promise<unknown>;
	};
	fetchUsageLimitsFn?: FetchUsageLimitsFn;
	vault?: Vault;
}
