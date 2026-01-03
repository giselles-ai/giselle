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

export type ApiSecretScryptConfig = {
	params?: {
		n: number;
		r: number;
		p: number;
		keyLen: number;
	};
	saltBytes?: number;
	/**
	 * When enabled, logs derived-key duration to `logger.debug` for observability.
	 * Never logs secrets or tokens.
	 */
	logDuration?: boolean;
};

export interface GiselleConfig {
	storage: GiselleStorage;
	sampleAppWorkspaceIds?: WorkspaceId[];
	llmProviders?: LanguageModelProvider[];
	/**
	 * scrypt configuration for API publishing secret hashing.
	 *
	 * These values affect only newly issued API secrets because the chosen params
	 * are stored in the ApiSecretRecord for verification.
	 */
	apiSecretScrypt?: ApiSecretScryptConfig;
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
