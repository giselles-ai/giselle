import type { RunningGeneration, Trigger } from "@giselles-ai/protocol";
import type { EmbeddingMetrics } from "@giselles-ai/rag";
import type { OnAppCreate, OnAppDelete } from "../apps";
import type {
	GenerationMetadata,
	OnGenerationComplete,
	OnGenerationError,
} from "../generations";
import type { OnTaskCreate } from "../tasks";
import type { BuildAiGatewayContext } from "./ai-gateway";
import type { QueryContext } from "./query-services";

export interface EmbeddingCompleteCallbackFunctionArgs {
	embeddingMetrics: EmbeddingMetrics;
	generation: RunningGeneration;
	queryContext: QueryContext;
	generationMetadata?: GenerationMetadata;
}

export type EmbeddingCompleteCallbackFunction = (
	args: EmbeddingCompleteCallbackFunctionArgs,
) => void | Promise<void>;

export type GiselleCallbacks = {
	appCreate?: OnAppCreate;
	appDelete?: OnAppDelete;
	flowTriggerUpdate?: (flowTrigger: Trigger) => Promise<void>;
	embeddingComplete?: EmbeddingCompleteCallbackFunction;
	generationComplete?: OnGenerationComplete;
	generationError?: OnGenerationError;
	taskCreate?: OnTaskCreate;
	buildAiGatewayContext?: BuildAiGatewayContext;
};
