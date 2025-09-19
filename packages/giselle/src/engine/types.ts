import type {
	EmbeddingProfileId,
	FlowTrigger,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import type {
	GitHubInstallationAppAuth,
	GitHubPersonalAccessTokenAuth,
} from "@giselle-sdk/github-tool";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";
import type { EmbeddingMetrics, QueryService } from "@giselle-sdk/rag";
import type { ModelMessage, ProviderMetadata } from "ai";
import type { Storage } from "unstorage";
import type { GiselleLogger } from "../logger/types";
import type { GiselleStorage } from "./experimental_storage";
import type { VectorStore } from "./experimental_vector-store/types/interface";
import type {
	CompletedGeneration,
	FailedGeneration,
	OutputFileBlob,
	RunningGeneration,
} from "./generations";
import type { TelemetrySettings } from "./telemetry";
import type { UsageLimits } from "./usage-limits";
import type { Vault } from "./vault";

type WaitUntilTask<T = unknown> = Promise<T> | WaitUntilCallback<T>;
type WaitUntilCallback<T = unknown> = () => T | Promise<T>;

export type WaitUntil<T = unknown> = (task: WaitUntilTask<T>) => void;

type GenerateContentArgs = {
	context: GiselleEngineContext;
	generation: RunningGeneration;
};
type GenerateContentProcess =
	| { type: "self" }
	| { type: "external"; process: (args: GenerateContentArgs) => Promise<void> };

export interface GenerationCompleteCallbackFunctionArgs {
	generation: CompletedGeneration;
	inputMessages: ModelMessage[];
	outputFileBlobs: OutputFileBlob[];
	providerMetadata?: ProviderMetadata;
}
type GenerationCompleteCallbackFunction = (
	args: GenerationCompleteCallbackFunctionArgs,
) => void | Promise<void>;

export interface GenerationFailedCallbackFunctionArgs {
	generation: FailedGeneration;
	inputMessages: ModelMessage[];
}
export type GenerationFailedCallbackFunction = (
	args: GenerationFailedCallbackFunctionArgs,
) => void | Promise<void>;

export interface EmbeddingCompleteCallbackFunctionArgs {
	embeddingMetrics: EmbeddingMetrics;
	generation: RunningGeneration;
	queryContext: GitHubQueryContext;
}
export type EmbeddingCompleteCallbackFunction = (
	args: EmbeddingCompleteCallbackFunctionArgs,
) => void | Promise<void>;

export interface GiselleEngineContext {
	storage: Storage;
	experimental_storage: GiselleStorage;
	sampleAppWorkspaceIds?: WorkspaceId[];
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
		generationFailed?: GenerationFailedCallbackFunction;
		flowTriggerUpdate?: (flowTrigger: FlowTrigger) => Promise<void>;
		embeddingComplete?: EmbeddingCompleteCallbackFunction;
	};
	vectorStore?: VectorStore;
	aiGateway?: {
		httpReferer: string;
		xTitle: string;
	};
	logger: GiselleLogger;
	waitUntil: WaitUntil;
	generateContentProcess: GenerateContentProcess;
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
export type GitHubQueryContext = {
	provider: "github";
	workspaceId: WorkspaceId;
	owner: string;
	repo: string;
	contentType: "blob" | "pullRequest";
	embeddingProfileId: EmbeddingProfileId;
};
export type QueryContext = GitHubQueryContext;

export type GitHubVectorStoreQueryService<
	M extends Record<string, unknown> = Record<string, never>,
> = QueryService<GitHubQueryContext, M>;

export interface GiselleEngineConfig {
	storage: Storage;
	experimental_storage: GiselleStorage;
	sampleAppWorkspaceIds?: WorkspaceId[];
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
		generationFailed?: GenerationFailedCallbackFunction;
		flowTriggerUpdate?: (flowTrigger: FlowTrigger) => Promise<void>;
		embeddingComplete?: EmbeddingCompleteCallbackFunction;
	};
	vectorStore?: VectorStore;
	aiGateway?: {
		httpReferer: string;
		xTitle: string;
	};
	logger?: GiselleLogger;
	waitUntil?: WaitUntil;
}
