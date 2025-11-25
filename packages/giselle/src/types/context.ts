import type { LanguageModelProvider } from "@giselles-ai/language-model";
import type { GiselleLogger } from "@giselles-ai/logger";
import type {
	GenerationOrigin,
	RunningGeneration,
	Task,
	WorkspaceId,
} from "@giselles-ai/protocol";
import type { GiselleStorage } from "@giselles-ai/storage";
import type { Vault } from "@giselles-ai/vault";
import type { GenerationMetadata } from "../generations";
import type { TelemetrySettings } from "../telemetry";
import type { GiselleCallbacks } from "./callbacks";
import type { GitHubIntegrationConfig } from "./integrations";
import type { VectorStoreQueryServices } from "./query-services";
import type {
	ConsumeAgentTimeCallback,
	FetchUsageLimitsFn,
} from "./usage-limits";
import type { WaitUntil } from "./wait-until";

type GenerateContentArgs = {
	context: GiselleContext;
	generation: RunningGeneration;
	metadata?: GenerationMetadata;
};

type GenerateContentProcess =
	| { type: "self" }
	| { type: "external"; process: (args: GenerateContentArgs) => Promise<void> };

export type SetRunTaskProcessArgs = {
	context: GiselleContext;
	task: Task;
	generationOriginType: GenerationOrigin["type"];
};

type RunTaskProcess =
	| { type: "self" }
	| {
			type: "external";
			process: (args: SetRunTaskProcessArgs) => Promise<void>;
	  };

export type RunTask = (args: SetRunTaskProcessArgs) => Promise<void>;

export interface GiselleContext {
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
	callbacks?: Omit<
		GiselleCallbacks,
		"generationComplete" | "generationError" | "taskCreate"
	>;
	logger: GiselleLogger;
	waitUntil: WaitUntil;
	generateContentProcess: GenerateContentProcess;
	runTaskProcess: RunTaskProcess;
}
