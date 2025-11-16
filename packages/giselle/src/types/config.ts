import type { LanguageModelProvider } from "@giselles-ai/language-model";
import type { GiselleLogger } from "@giselles-ai/logger";
import type { WorkspaceId } from "@giselles-ai/protocol";
import type { GiselleStorage } from "@giselles-ai/storage";
import type { OnGenerationComplete, OnGenerationError } from "../generations";
import type { TelemetrySettings } from "../telemetry";
import type { Vault } from "../vault";
import type { GiselleCallbacks } from "./callbacks";
import type { GiselleIntegrationConfig } from "./integrations";
import type { VectorStoreQueryServices } from "./query-services";
import type {
	ConsumeAgentTimeCallback,
	FetchUsageLimitsFn,
} from "./usage-limits";
import type { WaitUntil } from "./wait-until";

export interface GiselleConfig {
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
	callbacks?: GiselleCallbacks;
	aiGateway?: {
		httpReferer: string;
		xTitle: string;
	};
	logger?: GiselleLogger;
	waitUntil?: WaitUntil;
	onGenerationComplete?: OnGenerationComplete;
	onGenerationError?: OnGenerationError;
}
