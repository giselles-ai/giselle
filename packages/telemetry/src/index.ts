export * from "./types";
import type { CompletedGeneration } from "@giselle-sdk/data-type";
import type { TextGenerationLanguageModelData } from "@giselle-sdk/data-type";
import {
	GenerationContext,
	isTextGenerationNode,
} from "@giselle-sdk/data-type";
import {
	Capability,
	calculateDisplayCost,
	hasCapability,
	languageModels,
} from "@giselle-sdk/language-model";
import { Langfuse } from "langfuse";
import type {
	AnthropicProviderOptions,
	TelemetrySettings,
	TelemetryTag,
	ToolSet,
} from "./types";

export interface GenerationCompleteOption {
	telemetry: TelemetrySettings["metadata"];
	providerOptions?: {
		anthropic?: AnthropicProviderOptions;
	};
}

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
	if (args.provider === "openai" && args.toolSet?.openaiWebSearch) {
		tags.push("web-search", "openai:web-search");
	}

	// Google Search Grounding
	if (args.provider === "google" && args.configurations?.searchGrounding) {
		tags.push("web-search", "google:search-grounding");
	}

	// Anthropic Reasoning/Thinking
	if (args.provider === "anthropic") {
		if (args.configurations?.reasoning) {
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
			Array.isArray(args.configurations?.searchDomainFilter) &&
			args.configurations?.searchDomainFilter.length > 0
		) {
			tags.push("perplexity:search-domain-filter");
		}
	}

	return tags;
}

function getDeploymentId(): string | undefined {
	try {
		return process.env.VERCEL_DEPLOYMENT_ID;
	} catch {
		return undefined;
	}
}

export async function emitTelemetry(
	generation: CompletedGeneration,
	options: GenerationCompleteOption,
) {
	try {
		const langfuse = new Langfuse();

		if (!isTextGenerationNode(generation.context.operationNode)) {
			console.warn("Skipping telemetry for non-text generation");
			return;
		}

		const llm = generation.context.operationNode.content.llm;

		const promptJson = (() => {
			if (typeof generation.context.operationNode.content.prompt === "string") {
				try {
					return JSON.parse(generation.context.operationNode.content.prompt);
				} catch (error) {
					console.warn("Failed to parse prompt JSON for telemetry:", error);
					return { content: [] };
				}
			}
			return { content: [] };
		})();
		const input = (() => {
			// Handle various prompt formats more robustly
			if (promptJson.content?.[0]?.content?.[0]?.text) {
				return promptJson.content[0].content[0].text;
			}
			if (typeof promptJson.content === "string") {
				return promptJson.content;
			}
			return promptJson.text || "";
		})();

		const assistantMessage = generation.messages?.find(
			(msg) => msg.role === "assistant",
		);
		const output = assistantMessage?.content ?? "";

		const toolSet: ToolSet = {};
		const tools = generation.context.operationNode.content.tools;
		if (tools) {
			if (tools.openaiWebSearch) {
				toolSet.openaiWebSearch = true;
			}
			if (tools.github?.tools) {
				toolSet.github = tools.github.tools;
			}
			if (tools.postgres?.tools) {
				toolSet.postgres = tools.postgres.tools;
			}
		}

		const languageModel = languageModels.find((model) => model.id === llm.id);

		const providerOptions: { anthropic?: AnthropicProviderOptions } = {};
		if (
			languageModel &&
			llm.provider === "anthropic" &&
			llm.configurations?.reasoning &&
			hasCapability(languageModel, Capability.Reasoning)
		) {
			providerOptions.anthropic = {
				thinking: {
					type: "enabled",
				},
			};
		}

		const deploymentId = getDeploymentId();
		const trace = langfuse.trace({
			...(options?.telemetry?.userId && {
				userId: String(options.telemetry.userId),
			}),
			name: "llm-generation",
			input,
			tags: generateTelemetryTags({
				provider: llm.provider,
				modelId: llm.id,
				toolSet,
				configurations: llm.configurations ?? {},
				providerOptions,
			}),
			metadata: {
				...options?.telemetry,
				deploymentId,
			},
			output,
		});

		const span = trace.span({
			name: "llm-generation",
			startTime: new Date(generation.queuedAt ?? generation.createdAt),
			input,
			endTime: new Date(generation.completedAt),
			metadata: options?.telemetry,
			output,
		});

		const displayCost = await calculateDisplayCost(
			llm.provider,
			llm.id,
			generation.usage ?? {
				promptTokens: 0,
				completionTokens: 0,
				totalTokens: 0,
			},
		);

		span.generation({
			name: "llm-generation",
			model: llm.id,
			modelParameters: llm.configurations ?? {},
			input,
			usage: {
				input: generation.usage?.promptTokens ?? 0,
				output: generation.usage?.completionTokens ?? 0,
				total: generation.usage?.totalTokens ?? 0,
				inputCost: displayCost.inputCostForDisplay ?? 0,
				outputCost: displayCost.outputCostForDisplay ?? 0,
				totalCost: displayCost.totalCostForDisplay ?? 0,
				unit: "TOKENS",
			},
			startTime: new Date(generation.createdAt),
			completionStartTime: new Date(generation.startedAt),
			endTime: new Date(generation.completedAt),
			metadata: options?.telemetry,
			output,
		});

		await langfuse.flushAsync();
	} catch (error) {
		console.error("Telemetry emission failed:", error);
	}
}
