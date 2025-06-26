import type { CompletedGeneration, WorkspaceId } from "@giselle-sdk/data-type";
import type {
	GitHubInstallationAppAuth,
	GitHubPersonalAccessTokenAuth,
} from "@giselle-sdk/github-tool";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";
import type { QueryService } from "@giselle-sdk/rag";
import type { Storage } from "unstorage";
import type { VectorStore } from "./experimental_vector-store/types/interface";
import type { GenerationCompleteOption, TelemetrySettings } from "./telemetry";
import type { UsageLimits } from "./usage-limits";
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
		metadata?: TelemetrySettings["metadata"];
	};
	vault?: Vault;
	vectorStoreQueryServices?: {
		github?: GitHubVectorStoreQueryService<Record<string, unknown>>;
	};
	callbacks?: {
		generationComplete: (
			generation: CompletedGeneration,
			options: GenerationCompleteOption,
		) => Promise<void>;
	};
	vectorStore?: VectorStore;
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

// GitHub Query Context for rag integration
export interface GitHubQueryContext {
	workspaceId: WorkspaceId;
	owner: string;
	repo: string;
}

export type GitHubVectorStoreQueryService<
	M extends Record<string, unknown> = Record<string, never>,
> = QueryService<GitHubQueryContext, M>;

export interface GiselleEngineConfig {
	storage: Storage;
	sampleAppWorkspaceId?: WorkspaceId;
	llmProviders?: LanguageModelProvider[];
	integrationConfigs?: GiselleIntegrationConfig;
	onConsumeAgentTime?: ConsumeAgentTimeCallback;
	telemetry?: {
		isEnabled?: boolean;
		waitForFlushFn?: () => Promise<unknown>;
		metadata?: TelemetrySettings["metadata"];
	};
	fetchUsageLimitsFn?: FetchUsageLimitsFn;
	vault?: Vault;
	vectorStoreQueryServices?: {
		github?: GitHubVectorStoreQueryService<Record<string, unknown>>;
	};
	callbacks?: {
		generationComplete: (
			generation: CompletedGeneration,
			options: GenerationCompleteOption,
		) => Promise<void>;
	};
	vectorStore?: VectorStore;
}
