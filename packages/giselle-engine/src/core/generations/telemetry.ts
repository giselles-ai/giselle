import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type {
	CompletedGeneration,
	RunningGeneration,
} from "@giselle-sdk/data-type";
import type { ToolSet } from "ai";
import { Langfuse } from "langfuse";
import type { TelemetrySettings } from "./types";

type BaseFunctionalityTag = "web-search";

type ProviderNameTag = "openai" | "anthropic" | "google" | "perplexity" | "fal";

type ProviderOptionTag =
	| "openai:web-search"
	| "google:search-grounding"
	| "anthropic:reasoning"
	| "anthropic:thinking"
	| "perplexity:search-domain-filter";

type ModelNameTag = string;

type TelemetryTag =
	| BaseFunctionalityTag
	| ProviderNameTag
	| ProviderOptionTag
	| ModelNameTag;

export function generateTelemetryTags(args: {
	provider: string;
	modelId: string;
	toolSet: ToolSet;
	configurations: Record<string, unknown>;
	providerOptions?: {
		anthropic?: AnthropicProviderOptions;
	};
}): TelemetryTag[] {
	const tags: TelemetryTag[] = [];

	tags.push(args.provider, args.modelId);

	// OpenAI Web Search
	if (args.provider === "openai" && args.toolSet.openaiWebSearch) {
		tags.push("web-search", "openai:web-search");
	}

	// Google Search Grounding
	if (args.provider === "google" && args.configurations.searchGrounding) {
		tags.push("web-search", "google:search-grounding");
	}

	// Anthropic Reasoning/Thinking
	if (args.provider === "anthropic") {
		if (args.configurations.reasoning) {
			tags.push("anthropic:reasoning");
		}
		if (args.providerOptions?.anthropic?.thinking?.type === "enabled") {
			// treat as an independent tag because extended thinking is available only on specific models
			// ref: https://docs.anthropic.com/en/docs/about-claude/models/all-models#model-comparison-table
			tags.push("anthropic:thinking");
		}
	}

	// Perplexity Search Domain Filter
	if (args.provider === "perplexity") {
		tags.push("web-search");

		if (
			Array.isArray(args.configurations.searchDomainFilter) &&
			args.configurations.searchDomainFilter.length > 0
		) {
			tags.push("perplexity:search-domain-filter");
		}
	}

	return tags;
}

type LangfuseUnit =
	| "CHARACTERS"
	| "TOKENS"
	| "MILLISECONDS"
	| "SECONDS"
	| "IMAGES"
	| "REQUESTS";

export function createLangfuseTracer({
	runningGeneration,
	tags,
	messages,
	output,
	usage,
	completedGeneration,
	spanName,
	generationName,
	settings,
}: {
	runningGeneration: RunningGeneration;
	tags: string[];
	messages: { messages: unknown[] };
	output: string;
	usage: {
		input: number;
		output: number;
		total: number;
		inputCost: number; // these cost values are for preliminary analysis on Langfuse, not for billing purpose
		outputCost: number;
		totalCost: number;
		unit: LangfuseUnit;
	};
	completedGeneration: CompletedGeneration;
	spanName: string;
	generationName: string;
	settings?: TelemetrySettings;
}): Langfuse {
	const langfuse = new Langfuse();
	const trace = langfuse.trace({
		userId: String(settings?.metadata?.userId),
		name: spanName,
		metadata: {
			...settings?.metadata,
			...(process.env.VERCEL_DEPLOYMENT_ID && {
				deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
			}),
		},
		input: messages,
		output,
		tags,
	});

	const span = trace.span({
		name: spanName,
		startTime: new Date(runningGeneration.queuedAt),
		output,
		metadata: settings?.metadata,
		endTime: new Date(completedGeneration.completedAt),
	});

	const generation = span.generation({
		name: generationName,
		model: runningGeneration.context.operationNode.content.llm.id,
		modelParameters:
			runningGeneration.context.operationNode.content.llm.configurations,
		input: messages,
		usage,
		startTime: new Date(runningGeneration.createdAt),
		completionStartTime: new Date(runningGeneration.startedAt),
		metadata: settings?.metadata,
		output,
		endTime: new Date(completedGeneration.completedAt),
	});

	return langfuse;
}
