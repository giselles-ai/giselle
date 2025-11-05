import type {
	GitHubInstallationAppAuth,
	GitHubPersonalAccessTokenAuth,
} from "@giselles-ai/github-tool";
import type { LanguageModelProvider } from "@giselles-ai/language-model";
import type {
	EmbeddingProfileId,
	FlowTrigger,
	WorkspaceId,
} from "@giselles-ai/protocol";
import type { EmbeddingMetrics, QueryService } from "@giselles-ai/rag";
import type { ModelMessage, ProviderMetadata } from "ai";
import type { Act } from "../concepts/act";
import type { GiselleLogger } from "../logger/types";
import type {
	CompletedGeneration,
	FailedGeneration,
	GenerationMetadata,
	GenerationOrigin,
	OutputFileBlob,
	RunningGeneration,
} from "./generations";
import type { GiselleStorage } from "./storage";
import type { TelemetrySettings } from "./telemetry";
import type { UsageLimits } from "./usage-limits";
import type { Vault } from "./vault";

type WaitUntilTask<T = unknown> = Promise<T> | WaitUntilCallback<T>;
type WaitUntilCallback<T = unknown> = () => T | Promise<T>;

export type WaitUntil<T = unknown> = (task: WaitUntilTask<T>) => void;

type GenerateContentArgs = {
	context: GiselleEngineContext;
	generation: RunningGeneration;
	metadata?: GenerationMetadata;
};
type GenerateContentProcess =
	| { type: "self" }
	| { type: "external"; process: (args: GenerateContentArgs) => Promise<void> };

export type SetRunActProcessArgs = {
	context: GiselleEngineContext;
	act: Act;
	generationOriginType: GenerationOrigin["type"];
};
type RunActProcess =
	| { type: "self" }
	| {
			type: "external";
			process: (args: SetRunActProcessArgs) => Promise<void>;
	  };

export type RunAct = (args: SetRunActProcessArgs) => Promise<void>;

export interface GenerationCompleteCallbackFunctionArgs {
	generation: CompletedGeneration;
	inputMessages: ModelMessage[];
	outputFileBlobs: OutputFileBlob[];
	providerMetadata?: ProviderMetadata;
	generationMetadata?: GenerationMetadata;
}
type GenerationCompleteCallbackFunction = (
	args: GenerationCompleteCallbackFunctionArgs,
) => void | Promise<void>;

export interface GenerationFailedCallbackFunctionArgs {
	generation: FailedGeneration;
	inputMessages: ModelMessage[];
	generationMetadata?: GenerationMetadata;
}
export type GenerationFailedCallbackFunction = (
	args: GenerationFailedCallbackFunctionArgs,
) => void | Promise<void>;

export interface EmbeddingCompleteCallbackFunctionArgs {
	embeddingMetrics: EmbeddingMetrics;
	generation: RunningGeneration;
	queryContext: QueryContext;
	generationMetadata?: GenerationMetadata;
}
export type EmbeddingCompleteCallbackFunction = (
	args: EmbeddingCompleteCallbackFunctionArgs,
) => void | Promise<void>;

export interface GiselleEngineContext {
	storage: GiselleStorage;
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
		githubIssue?: GitHubVectorStoreQueryService<Record<string, unknown>>;
		githubPullRequest?: GitHubVectorStoreQueryService<Record<string, unknown>>;
		document?: DocumentVectorStoreQueryService<Record<string, unknown>>;
	};
	callbacks?: {
		generationComplete?: GenerationCompleteCallbackFunction;
		generationFailed?: GenerationFailedCallbackFunction;
		flowTriggerUpdate?: (flowTrigger: FlowTrigger) => Promise<void>;
		embeddingComplete?: EmbeddingCompleteCallbackFunction;
	};
	aiGateway?: {
		httpReferer: string;
		xTitle: string;
	};
	logger: GiselleLogger;
	waitUntil: WaitUntil;
	generateContentProcess: GenerateContentProcess;
	runActProcess: RunActProcess;
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
	contentType: "blob" | "pullRequest" | "issue";
	embeddingProfileId: EmbeddingProfileId;
};

export type DocumentVectorStoreQueryContext = {
	provider: "document";
	workspaceId: WorkspaceId;
	documentVectorStoreId: string;
	embeddingProfileId: EmbeddingProfileId;
};

export type QueryContext = GitHubQueryContext | DocumentVectorStoreQueryContext;

export type GitHubVectorStoreQueryService<
	M extends Record<string, unknown> = Record<string, never>,
> = QueryService<GitHubQueryContext, M>;

export type DocumentVectorStoreQueryService<
	M extends Record<string, unknown> = Record<string, never>,
> = QueryService<DocumentVectorStoreQueryContext, M>;

export interface GiselleEngineConfig {
	storage: GiselleStorage;
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
		githubIssue?: GitHubVectorStoreQueryService<Record<string, unknown>>;
		githubPullRequest?: GitHubVectorStoreQueryService<Record<string, unknown>>;
		document?: DocumentVectorStoreQueryService<Record<string, unknown>>;
	};
	callbacks?: {
		generationComplete?: GenerationCompleteCallbackFunction;
		generationFailed?: GenerationFailedCallbackFunction;
		flowTriggerUpdate?: (flowTrigger: FlowTrigger) => Promise<void>;
		embeddingComplete?: EmbeddingCompleteCallbackFunction;
	};
	aiGateway?: {
		httpReferer: string;
		xTitle: string;
	};
	logger?: GiselleLogger;
	waitUntil?: WaitUntil;
}
