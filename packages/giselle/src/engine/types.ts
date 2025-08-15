import type {
	FlowTrigger,
	OutputId,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import type {
	GitHubInstallationAppAuth,
	GitHubPersonalAccessTokenAuth,
} from "@giselle-sdk/github-tool";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";
import type { EmbeddingProfileId, QueryService } from "@giselle-sdk/rag";
import type { ModelMessage } from "ai";
import type { Storage } from "unstorage";
import type { GiselleStorage } from "./experimental_storage";
import type { VectorStore } from "./experimental_vector-store/types/interface";
import type { CompletedGeneration } from "./generations";
import type { GenerationCompleteOption, TelemetrySettings } from "./telemetry";
import type { UsageLimits } from "./usage-limits";
import type { Vault } from "./vault";

export interface GenerationCompleteCallbackFunctionArgs {
	generation: CompletedGeneration;
	inputMessages: ModelMessage[];
	outputFiles: Array<{
		outputId: OutputId;
		id: string;
		contentType: string;
		data: Uint8Array<ArrayBufferLike>;
	}>;
}
type GenerationCompleteCallbackFunction = (
	args: GenerationCompleteCallbackFunctionArgs,
	options: GenerationCompleteOption,
) => void | Promise<void>;

export interface GiselleEngineContext {
	storage: Storage;
	experimental_storage: GiselleStorage;
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
	vault: Vault;
	vectorStoreQueryServices?: {
		github?: GitHubVectorStoreQueryService<Record<string, unknown>>;
		githubPullRequest?: GitHubVectorStoreQueryService<Record<string, unknown>>;
	};
	callbacks?: {
		generationComplete?: GenerationCompleteCallbackFunction;
		flowTriggerUpdate?: (flowTrigger: FlowTrigger) => Promise<void>;
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
	fileSha: string;
	path: string;
};

// GitHub Query Context for rag integration
export interface GitHubQueryContext {
	workspaceId: WorkspaceId;
	owner: string;
	repo: string;
	embeddingProfileId: EmbeddingProfileId;
}

export type GitHubVectorStoreQueryService<
	M extends Record<string, unknown> = Record<string, never>,
> = QueryService<GitHubQueryContext, M>;

export interface GiselleEngineConfig {
	storage: Storage;
	experimental_storage: GiselleStorage;
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
	vault: Vault;
	vectorStoreQueryServices?: {
		github?: GitHubVectorStoreQueryService<Record<string, unknown>>;
		githubPullRequest?: GitHubVectorStoreQueryService<Record<string, unknown>>;
	};
	callbacks?: {
		generationComplete?: GenerationCompleteCallbackFunction;
		flowTriggerUpdate?: (flowTrigger: FlowTrigger) => Promise<void>;
	};
	vectorStore?: VectorStore;
}
