import type { LanguageModelProvider } from "@giselles-ai/language-model";
import type { GiselleLogger } from "@giselles-ai/logger";
import type {
	Act,
	GenerationOrigin,
	RunningGeneration,
	Trigger,
	WorkspaceId,
} from "@giselles-ai/protocol";
import type { GiselleStorage } from "@giselles-ai/storage";
import type { GenerationMetadata } from "../generations";
import type { TelemetrySettings } from "../telemetry";
import type { Vault } from "../vault";
import type {
	AppCreateCallbackFunction,
	AppDeleteCallbackFunction,
	EmbeddingCompleteCallbackFunction,
	GenerationCompleteCallbackFunction,
	GenerationFailedCallbackFunction,
} from "./callbacks";
import type {
	GiselleIntegrationConfig,
	GitHubIntegrationConfig,
} from "./integrations";
import type {
	DocumentVectorStoreQueryService,
	GitHubVectorStoreQueryService,
} from "./query-services";
import type {
	ConsumeAgentTimeCallback,
	FetchUsageLimitsFn,
} from "./usage-limits";

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

export type GiselleEngineCallbacks = {
	appCreate?: AppCreateCallbackFunction;
	appDelete?: AppDeleteCallbackFunction;
	generationComplete?: GenerationCompleteCallbackFunction;
	generationFailed?: GenerationFailedCallbackFunction;
	flowTriggerUpdate?: (flowTrigger: Trigger) => Promise<void>;
	embeddingComplete?: EmbeddingCompleteCallbackFunction;
};

export type VectorStoreQueryServices = {
	github?: GitHubVectorStoreQueryService<Record<string, unknown>>;
	githubIssue?: GitHubVectorStoreQueryService<Record<string, unknown>>;
	githubPullRequest?: GitHubVectorStoreQueryService<Record<string, unknown>>;
	document?: DocumentVectorStoreQueryService<Record<string, unknown>>;
};

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
	vectorStoreQueryServices?: VectorStoreQueryServices;
	callbacks?: GiselleEngineCallbacks;
	aiGateway?: {
		httpReferer: string;
		xTitle: string;
	};
	logger: GiselleLogger;
	waitUntil: WaitUntil;
	generateContentProcess: GenerateContentProcess;
	runActProcess: RunActProcess;
}

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
	vectorStoreQueryServices?: VectorStoreQueryServices;
	callbacks?: GiselleEngineCallbacks;
	aiGateway?: {
		httpReferer: string;
		xTitle: string;
	};
	logger?: GiselleLogger;
	waitUntil?: WaitUntil;
}
