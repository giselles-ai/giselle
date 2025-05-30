import type { WorkspaceId } from "@giselle-sdk/data-type";
import type {
	GitHubInstallationAppAuth,
	GitHubPersonalAccessTokenAuth,
} from "@giselle-sdk/github-tool";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";
import type { QueryFunction, QueryFunctionParams } from "@giselle-sdk/rag";
import type { UsageLimits } from "@giselle-sdk/usage-limits";
import type { Storage } from "unstorage";
import type { CostTracker } from "./cost-tracking/tracker";
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
	vectorStoreQueryFunctions?: {
		github?: GitHubVectorStoreQueryFunction;
	};
	costTracker: CostTracker;
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

export type GithubEmbeddingMetadata = {
	commitSha: string;
	fileSha: string;
	path: string;
	nodeId: string;
};
export type GitHubEmbeddingFilter = {
	workspaceId: WorkspaceId;
	owner: string;
	repo: string;
};
export type GitHubVectorStoreQueryFunctionParams =
	QueryFunctionParams<GitHubEmbeddingFilter>;
export type GitHubVectorStoreQueryFunction = QueryFunction<
	GithubEmbeddingMetadata,
	GitHubEmbeddingFilter
>;

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
	vectorStoreQueryFunctions?: {
		github?: GitHubVectorStoreQueryFunction;
	};
}
