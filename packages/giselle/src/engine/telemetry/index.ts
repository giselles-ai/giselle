export * from "./types";

import {
	type ImageGenerationNode,
	isImageGenerationNode,
	isQueryNode,
	isTextGenerationNode,
	type TextGenerationNode,
} from "@giselle-sdk/data-type";
import {
	Capability,
	calculateDisplayCost,
	hasCapability,
	languageModels,
} from "@giselle-sdk/language-model";
import { type ApiMediaContentType, Langfuse, LangfuseMedia } from "langfuse";
import type { Storage } from "unstorage";
import type { CompletedGeneration } from "../../concepts/generation";
import type {
	AnthropicProviderOptions,
	TelemetrySettings,
	TelemetryTag,
	ToolSet,
} from "./types";

export interface ReadOnlyStorage {
	getItemRaw: (key: string) => Promise<Uint8Array | null | undefined>;
}

export interface GenerationCompleteOption {
	telemetry?: TelemetrySettings;
	storage?: Storage;
}

interface LangfuseParams {
	traceParams: {
		userId?: string;
		name: string;
		input: string;
		tags: TelemetryTag[];
		metadata?: TelemetrySettings["metadata"];
		output?: string;
	};
	spanParams: {
		name: string;
		startTime: Date;
		input: string;
		endTime: Date;
		metadata?: TelemetrySettings["metadata"];
		output?: string;
	};
	generationParams: {
		name: string;
		model: string;
		modelParameters: Record<
			string,
			string | number | boolean | string[] | null
		>;
		input: string;
		usage: {
			input: number;
			output: number;
			total: number;
			unit: "TOKENS" | "IMAGES";
			inputCost?: number;
			outputCost?: number;
			totalCost?: number;
		};
		startTime: Date;
		completionStartTime: Date;
		endTime: Date;
		metadata?: TelemetrySettings["metadata"];
		output?: string;
	};
}

interface PromptJson {
	content?: Array<{
		content?: Array<{
			text?: string;
		}>;
	}>;
	text?: string;
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
		if (args.configurations?.reasoningText) {
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

function extractPromptInput(
	operationNode: TextGenerationNode | ImageGenerationNode,
): string {
	const promptJson = (() => {
		if (typeof operationNode.content.prompt === "string") {
			try {
				return JSON.parse(operationNode.content.prompt) as PromptJson;
			} catch (error) {
				console.warn("Failed to parse prompt JSON for telemetry:", error);
				return { text: operationNode.content.prompt };
			}
		}
		return { content: [] };
	})();

	if (promptJson.content?.[0]?.content?.[0]?.text) {
		return promptJson.content[0].content[0].text;
	}
	if (typeof promptJson.content === "string") {
		return promptJson.content;
	}
	return promptJson.text || "";
}

function extractInputOutputForTextGeneration(
	generation: CompletedGeneration,
	operationNode: TextGenerationNode,
) {
	const input = extractPromptInput(operationNode);
	const output = generation.outputs.find(
		(output) => output.type === "generated-text",
	);

	return { input, output: output?.content };
}

function extractInputForImageGeneration(
	_generation: CompletedGeneration,
	operationNode: ImageGenerationNode,
) {
	const input = extractPromptInput(operationNode);

	// For image generation, we don't need output in telemetry
	return { input, output: undefined };
}

function extractToolSet(operationNode: TextGenerationNode): ToolSet {
	const toolSet: ToolSet = {};
	const tools = operationNode.content.tools as {
		openaiWebSearch?: boolean;
		github?: { tools: string[] };
		postgres?: { tools: string[] };
	};
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
	return toolSet;
}

function getProviderOptions(
	provider: string,
	configurations: Record<string, unknown>,
	modelId: string,
): { anthropic?: AnthropicProviderOptions } {
	const providerOptions: { anthropic?: AnthropicProviderOptions } = {};
	const languageModel = languageModels.find((model) => model.id === modelId);

	if (
		languageModel &&
		provider === "anthropic" &&
		"reasoning" in configurations &&
		configurations.reasoningText &&
		hasCapability(languageModel, Capability.Reasoning)
	) {
		providerOptions.anthropic = {
			thinking: {
				type: "enabled",
			},
		};
	}

	return providerOptions;
}

async function createLangfuseParams(
	generation: CompletedGeneration,
	options: GenerationCompleteOption,
	type: "text" | "image",
): Promise<LangfuseParams> {
	const operationNode = generation.context.operationNode;
	const llm = operationNode.content.llm as {
		provider: string;
		id: string;
		configurations?: Record<
			string,
			string | number | boolean | string[] | null
		>;
	};
	const { input, output } =
		type === "text"
			? extractInputOutputForTextGeneration(
					generation,
					operationNode as TextGenerationNode,
				)
			: extractInputForImageGeneration(
					generation,
					operationNode as ImageGenerationNode,
				);

	const baseParams = {
		name: type === "text" ? "llm-generation" : "image-generation",
		input,
		output,
		metadata: options?.telemetry?.metadata,
	};

	const displayCost =
		type === "text"
			? await calculateDisplayCost(llm.provider, llm.id, {
					inputTokens: generation.usage?.inputTokens ?? 0,
					outputTokens: generation.usage?.outputTokens ?? 0,
				})
			: null;

	return {
		traceParams: {
			...(options?.telemetry?.metadata?.userId && {
				userId: String(options.telemetry?.metadata.userId),
			}),
			...baseParams,
			tags:
				type === "text"
					? generateTelemetryTags({
							provider: llm.provider,
							modelId: llm.id,
							toolSet: extractToolSet(operationNode as TextGenerationNode),
							configurations: llm.configurations ?? {},
							providerOptions: getProviderOptions(
								llm.provider,
								llm.configurations ?? {},
								llm.id,
							),
						})
					: [llm.provider, llm.id],
		},
		spanParams: {
			...baseParams,
			startTime: new Date(generation.queuedAt ?? generation.createdAt),
			endTime: new Date(generation.completedAt),
		},
		generationParams: {
			...baseParams,
			model: llm.id,
			modelParameters: llm.configurations ?? {},
			usage:
				type === "text"
					? {
							input: generation.usage?.inputTokens ?? 0,
							output: generation.usage?.outputTokens ?? 0,
							total: generation.usage?.totalTokens ?? 0,
							unit: "TOKENS",
							inputCost: displayCost?.inputCostForDisplay ?? 0,
							outputCost: displayCost?.outputCostForDisplay ?? 0,
							totalCost: displayCost?.totalCostForDisplay ?? 0,
						}
					: {
							input: 0,
							output: 0,
							total: 0,
							unit: "IMAGES",
						},
			startTime: new Date(generation.createdAt),
			completionStartTime: new Date(generation.startedAt),
			endTime: new Date(generation.completedAt),
		},
	};
}

/**
 * Create LangfuseMedia objects from generated images if storage is available
 */
async function createImageMediaObjects(
	generation: CompletedGeneration,
	storage?: ReadOnlyStorage,
): Promise<{ [key: string]: LangfuseMedia } | undefined> {
	if (!storage) {
		return undefined;
	}

	const generatedImageOutputs = generation.outputs.filter(
		(output) => output.type === "generated-image",
	);

	if (generatedImageOutputs.length === 0) {
		return undefined;
	}

	const imageMediaObjects: { [key: string]: LangfuseMedia } = {};

	for (const output of generatedImageOutputs) {
		for (const image of output.contents) {
			try {
				const imagePath = `generations/${generation.id}/generated-images/${image.filename}`;
				const imageData = await storage.getItemRaw(imagePath);

				if (imageData) {
					// Convert imageData to Buffer safely
					let buffer: Buffer;
					try {
						buffer = Buffer.from(imageData);
					} catch (error) {
						console.warn("Error converting imageData to Buffer:", error);
						continue;
					}

					const mediaKey = `${output.outputId}_${image.id}`;
					imageMediaObjects[mediaKey] = new LangfuseMedia({
						contentType: image.contentType as ApiMediaContentType,
						contentBytes: buffer,
					});
				}
			} catch (error) {
				console.warn(
					`Failed to load image ${image.filename} for telemetry:`,
					error,
				);
			}
		}
	}

	return Object.keys(imageMediaObjects).length > 0
		? imageMediaObjects
		: undefined;
}

export async function emitTelemetry(
	generation: CompletedGeneration,
	options: GenerationCompleteOption,
) {
	try {
		const operationNode = generation.context.operationNode;
		const nodeType = operationNode.content.type;

		if (isQueryNode(operationNode)) {
			return;
		}

		if (
			!isTextGenerationNode(operationNode) &&
			!isImageGenerationNode(operationNode)
		) {
			throw new Error(`Unsupported generation type: ${nodeType}`);
		}

		const isImageGeneration = isImageGenerationNode(operationNode);

		const { traceParams, spanParams, generationParams } =
			await createLangfuseParams(
				generation,
				options,
				isImageGeneration ? "image" : "text",
			);

		const langfuse = new Langfuse();
		const trace = langfuse.trace(traceParams);
		const span = trace.span(spanParams);
		const langfuseGeneration = span.generation(generationParams);

		if (isImageGeneration) {
			const imageMediaObjects = options.storage
				? await createImageMediaObjects(generation, options.storage)
				: undefined;

			if (imageMediaObjects) {
				const imageMediaArray = Object.values(imageMediaObjects);
				trace.update({
					output: imageMediaArray,
				});
				span.update({
					output: imageMediaArray,
				});
				langfuseGeneration.update({
					output: imageMediaArray,
				});
			}
		}

		await langfuse.flushAsync();
	} catch (error) {
		console.error("Telemetry emission failed:", error);
	}
}
