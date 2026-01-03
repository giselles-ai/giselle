import type { LanguageModelProvider } from "@giselles-ai/language-model";
import type { GiselleLogger } from "@giselles-ai/logger";
import type { WorkspaceId } from "@giselles-ai/protocol";
import type { GiselleStorage } from "@giselles-ai/storage";
import type { Vault } from "@giselles-ai/vault";
import type { TelemetrySettings } from "../telemetry";
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
	/**
	 * Server-side pepper used to hash API publishing secrets.
	 * Store this in a secure environment variable (e.g. Vercel Environment Variables).
	 */
	apiSecretPepper?: string;
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
	logger?: GiselleLogger;
	waitUntil?: WaitUntil;
	experimental_contentGenerationNode?: boolean;
}
