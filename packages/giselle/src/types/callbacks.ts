import type {
	App,
	AppId,
	CompletedGeneration,
	FailedGeneration,
	OutputFileBlob,
	RunningGeneration,
} from "@giselles-ai/protocol";
import type { EmbeddingMetrics } from "@giselles-ai/rag";
import type { ModelMessage, ProviderMetadata } from "ai";

import type { GenerationMetadata } from "../generations";
import type { QueryContext } from "./query-services";

export interface GenerationCompleteCallbackFunctionArgs {
	generation: CompletedGeneration;
	inputMessages: ModelMessage[];
	outputFileBlobs: OutputFileBlob[];
	providerMetadata?: ProviderMetadata;
	generationMetadata?: GenerationMetadata;
}

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

export type GenerationCompleteCallbackFunction = (
	args: GenerationCompleteCallbackFunctionArgs,
) => void | Promise<void>;

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
