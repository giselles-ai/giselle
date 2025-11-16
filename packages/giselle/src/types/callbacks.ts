import type {
	App,
	AppId,
	FailedGeneration,
	RunningGeneration,
	Trigger,
} from "@giselles-ai/protocol";
import type { EmbeddingMetrics } from "@giselles-ai/rag";
import type { ModelMessage } from "ai";

import type { GenerationMetadata } from "../generations";
import type { QueryContext } from "./query-services";

export type AppCreateCallbackFunction = (args: {
	app: App;
}) => void | Promise<void>;

export type AppDeleteCallbackFunction = (args: {
	appId: AppId;
}) => void | Promise<void>;

export interface GenerationFailedCallbackFunctionArgs {
	generation: FailedGeneration;
	inputMessages: ModelMessage[];
	generationMetadata?: GenerationMetadata;
}

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
};
