import type {
	App,
	AppId,
	RunningGeneration,
	Trigger,
} from "@giselles-ai/protocol";
import type { EmbeddingMetrics } from "@giselles-ai/rag";
import type {
	GenerationMetadata,
	OnGenerationComplete,
	OnGenerationError,
} from "../generations";
import type { QueryContext } from "./query-services";

export type AppCreateCallbackFunction = (args: {
	app: App;
}) => void | Promise<void>;

export type AppDeleteCallbackFunction = (args: {
	appId: AppId;
}) => void | Promise<void>;

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
	appCreate?: AppCreateCallbackFunction;
	appDelete?: AppDeleteCallbackFunction;
	flowTriggerUpdate?: (flowTrigger: Trigger) => Promise<void>;
	embeddingComplete?: EmbeddingCompleteCallbackFunction;
	generationComplete?: OnGenerationComplete;
	generationError?: OnGenerationError;
};
