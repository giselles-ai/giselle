import { calculateDisplayCost } from "@giselles-ai/language-model";
import {
	getEntry,
	parseConfiguration,
} from "@giselles-ai/language-model-registry";
import {
	type CompletedGeneration,
	type ContentGenerationNode,
	type FailedGeneration,
	type ImageGenerationNode,
	isActionNode,
	isContentGenerationNode,
	isImageGenerationNode,
	isQueryNode,
	isTextGenerationNode,
	type OutputFileBlob,
	type TextGenerationNode,
} from "@giselles-ai/protocol";
import type { DataContent, ModelMessage } from "ai";
import { type ApiMediaContentType, Langfuse, LangfuseMedia } from "langfuse";

async function toBuffer(data: DataContent | URL) {
	if (typeof data === "string") {
		return Buffer.from(data);
	}
	if (Buffer.isBuffer(data)) {
		return data;
	}
	if (data instanceof URL) {
		const response = await fetch(data);
		const arrayBuffer = await response.arrayBuffer();
		return Buffer.from(arrayBuffer);
	}
	if (data instanceof Uint8Array) {
		return Buffer.from(data);
	}
	// ArrayBuffer or other types
	return Buffer.from(data);
}

function prepareLangfuseInput(messages: ModelMessage[]) {
	return Promise.all(
		messages.map(async (message) => {
			// If content is a string, return as-is
			if (!Array.isArray(message.content)) {
				return message.content;
			}

			// Process array content with media uploads
			const processedContent = await Promise.all(
				message.content.map(async (item) => {
					switch (item.type) {
						case "text":
						case "reasoning":
						case "tool-call":
						case "tool-result":
							return item;

						case "file":
							return {
								...item,
								data: new LangfuseMedia({
									contentType: item.mediaType as ApiMediaContentType,
									contentBytes: await toBuffer(item.data),
								}),
							};

						case "image":
							return {
								...item,
								data: new LangfuseMedia({
									contentType: item.mediaType as ApiMediaContentType,
									contentBytes: await toBuffer(item.image),
								}),
							};

						default: {
							// Type-safe exhaustive check
							const unhandled: never = item;
							throw new Error(
								`Unhandled content type: ${JSON.stringify(unhandled)}`,
							);
						}
					}
				}),
			);

			return {
				...message,
				content: processedContent,
			};
		}),
	);
}

function extractTags(
	node: TextGenerationNode | ImageGenerationNode | ContentGenerationNode,
) {
	if (isContentGenerationNode(node)) {
		const { content } = node;
		const tags: string[] = [`provider:${content.languageModel.provider}`];

		const languageModel = getEntry(content.languageModel.id);
		switch (languageModel.providerId) {
			case "anthropic": {
				const config = parseConfiguration(
					languageModel,
					content.languageModel.configuration,
				);

				if (config.thinking) {
					tags.push("feature:thinking");
				}
				const useWebSearchTool = content.tools.some(
					(tool) => tool.name === "anthropic-web-search",
				);
				if (useWebSearchTool) {
					tags.push("tool:web-search");
				}
				break;
			}
			case "google": {
				const useGoogleWebSearchTool = content.tools.some(
					(tool) => tool.name === "google-web-search",
				);
				if (useGoogleWebSearchTool) {
					tags.push("tool:web-search");
				}
				break;
			}
			case "openai": {
				const useOpenAiWebSearchTool = content.tools.some(
					(tool) => tool.name === "openai-web-search",
				);
				if (useOpenAiWebSearchTool) {
					tags.push("tool:web-search");
				}
				break;
			}
		}

		const useGithubApiTool = content.tools.some(
			(tool) => tool.name === "github-api",
		);
		if (useGithubApiTool) {
			tags.push("tool:github");
		}

		const usePostgresTool = content.tools.some(
			(tool) => tool.name === "postgres",
		);
		if (usePostgresTool) {
			tags.push("tool:postgres");
		}

		return tags;
	}
	const { content } = node;
	const tags: string[] = [`provider:${content.llm.provider}`];

	// Only text generation nodes have additional features
	if (content.type === "textGeneration") {
		const { llm, tools } = content;

		// Provider-specific features
		if (llm.provider === "anthropic" && llm.configurations.reasoningText) {
			tags.push("feature:thinking");
		}
		if (llm.provider === "google" && llm.configurations.searchGrounding) {
			tags.push("tool:web-search");
		}
		if (llm.provider === "openai" && tools?.openaiWebSearch) {
			tags.push("tool:web-search");
		}
		if (llm.provider === "anthropic" && tools?.anthropicWebSearch) {
			tags.push("tool:web-search");
		}
		if (llm.provider === "perplexity") {
			tags.push("tool:web-search");
		}

		// Tool integrations
		if (tools?.github) tags.push("tool:github");
		if (tools?.postgres) tags.push("tool:postgres");
	}

	return tags;
}

function extractMetadata(
	node: TextGenerationNode | ImageGenerationNode | ContentGenerationNode,
): Record<string, unknown> {
	const metadata: Record<string, unknown> = {};

	if (isContentGenerationNode(node)) {
		const { content } = node;
		const languageModel = getEntry(content.languageModel.id);

		switch (languageModel.providerId) {
			case "anthropic":
				{
					const configuration = parseConfiguration(
						languageModel,
						content.languageModel.configuration,
					);
					if (configuration.thinking) {
						metadata["tools.thinking.provider"] = "anthropic.thinking";
					}
					const useAnthropicWebSearchTool = content.tools.some(
						(tool) => tool.name === "anthropic-web-search",
					);
					if (useAnthropicWebSearchTool) {
						metadata["tools.webSearch.provider"] = "anthropic.webSearch";
					}
				}
				break;
			case "google":
				{
					const useGoogleWebSearchTool = content.tools.some(
						(tool) => tool.name === "google-web-search",
					);
					if (useGoogleWebSearchTool) {
						metadata["tools.webSearch.provider"] = "google.webSearch";
					}
				}
				break;
			case "openai":
				{
					const useOpenAIWebSearchTool = content.tools.some(
						(tool) => tool.name === "openai-web-search",
					);
					if (useOpenAIWebSearchTool) {
						metadata["tools.webSearch.provider"] = "openai.webSearch";
					}
				}
				break;
		}

		// Tool integrations metadata
		const githubTool = content.tools.find((tool) => tool.name === "github-api");
		if (githubTool) {
			metadata["tools.github.tools"] = githubTool.configuration.useTools;
		}
		metadata["llm.configuration"] = content.languageModel.configuration;
		return metadata;
	}

	const { content } = node;

	// Only text generation nodes have metadata-worthy features
	if (content.type === "textGeneration") {
		const { llm, tools } = content;

		// Provider-specific metadata
		if (llm.provider === "anthropic" && llm.configurations.reasoningText) {
			metadata["tools.thinking.provider"] = "anthropic.thinking";
		}
		if (llm.provider === "anthropic" && tools?.anthropicWebSearch) {
			metadata["tools.webSearch.provider"] = "anthropic.webSearch";
		}
		if (llm.provider === "google" && llm.configurations.searchGrounding) {
			metadata["tools.webSearch.provider"] = "google.googleSearch";
		}
		if (llm.provider === "openai" && tools?.openaiWebSearch) {
			metadata["tools.webSearch.provider"] = "openai.webSearchPreview";
		}
		if (llm.provider === "perplexity") {
			metadata["tools.webSearch.provider"] = "perplexity";
		}

		// Tool integrations metadata
		if (tools?.github) {
			metadata["tools.github.tools"] = tools.github.tools;
		}
		metadata["llm.configuration"] = content.llm.configurations;
	}

	return metadata;
}

async function traceContentGeneration(args: {
	generation: CompletedGeneration | FailedGeneration;
	operationNode: ContentGenerationNode;
	inputMessages: ModelMessage[];
	userId?: string;
	metadata?: Record<string, unknown>;
	tags?: string[];
	sessionId?: string;
}) {
	const langfuseInput = await prepareLangfuseInput(args.inputMessages);

	const langfuse = new Langfuse();
	const trace = langfuse.trace({
		name: "generation",
		userId: args.userId ? String(args.userId) : undefined,
		input: langfuseInput,
		sessionId: args.sessionId,
	});

	const tags = [...(args.tags ?? []), ...extractTags(args.operationNode)];
	const metadata = {
		...args.metadata,
		...extractMetadata(args.operationNode),
	};

	if (args.generation.status === "failed") {
		trace.update({
			tags,
			metadata,
		});

		trace.generation({
			name: "generateContent",
			model: args.operationNode.content.languageModel.id,
			modelParameters: args.operationNode.content.languageModel.configuration,
			input: langfuseInput,
			startTime: new Date(args.generation.startedAt),
			endTime: new Date(args.generation.failedAt),
			metadata,
			level: "ERROR",
			statusMessage: args.generation.error.message,
		});
		await langfuse.flushAsync();
		return;
	}

	const usage = args.generation.usage ?? {
		inputTokens: 0,
		outputTokens: 0,
		totalTokens: 0,
	};

	const cost = await calculateDisplayCost(
		args.operationNode.content.languageModel.provider,
		args.operationNode.content.languageModel.id,
		{
			inputTokens: usage.inputTokens ?? 0,
			outputTokens: usage.outputTokens ?? 0,
		},
	);

	trace.update({
		output: args.generation.outputs,
		tags,
		metadata,
	});

	trace.generation({
		name: "generateContent",
		model: args.operationNode.content.languageModel.id,
		modelParameters: args.operationNode.content.languageModel.configuration,
		input: langfuseInput,
		output: args.generation.outputs,
		usage: {
			unit: "TOKENS",
			input: usage.inputTokens ?? 0,
			output: usage.outputTokens ?? 0,
			total: usage.totalTokens ?? 0,
			inputCost: cost.inputCostForDisplay,
			outputCost: cost.outputCostForDisplay,
			totalCost: cost.totalCostForDisplay,
		},
		startTime: new Date(args.generation.startedAt),
		endTime: new Date(args.generation.completedAt),
		metadata,
		level: "DEFAULT",
	});

	await langfuse.flushAsync();
}

export async function traceGeneration(args: {
	generation: CompletedGeneration | FailedGeneration;
	inputMessages: ModelMessage[];
	userId?: string;
	metadata?: Record<string, unknown>;
	tags?: string[];
	outputFileBlobs?: OutputFileBlob[];
	sessionId?: string;
}) {
	try {
		const { operationNode } = args.generation.context;

		// Skip telemetry for query and action nodes
		if (isQueryNode(operationNode) || isActionNode(operationNode)) {
			return;
		}

		// Handle content generation nodes separately
		if (isContentGenerationNode(operationNode)) {
			await traceContentGeneration({
				generation: args.generation,
				operationNode,
				inputMessages: args.inputMessages,
				userId: args.userId,
				metadata: args.metadata,
				tags: args.tags,
				sessionId: args.sessionId,
			});
			return;
		}

		// Validate supported node types
		if (
			!isTextGenerationNode(operationNode) &&
			!isImageGenerationNode(operationNode)
		) {
			console.warn(
				`Telemetry: Unsupported node type: ${operationNode.content.type}`,
			);
			return;
		}

		// Prepare input messages with media uploads
		const langfuseInput = await prepareLangfuseInput(args.inputMessages);

		// Initialize Langfuse client and create trace
		const langfuse = new Langfuse();
		const trace = langfuse.trace({
			name: "generation",
			userId: args.userId ? String(args.userId) : undefined,
			input: langfuseInput,
			sessionId: args.sessionId,
		});

		// Common trace metadata
		const tags = [...(args.tags ?? []), ...extractTags(operationNode)];
		const metadata = {
			...args.metadata,
			...extractMetadata(operationNode),
		};

		const llm = operationNode.content.llm;

		const generationName = isTextGenerationNode(operationNode)
			? "generateText"
			: isImageGenerationNode(operationNode)
				? "generateImage"
				: undefined;

		if (args.generation.status === "failed") {
			trace.update({
				tags,
				metadata,
			});

			trace.generation({
				name: generationName,
				model: llm.id,
				modelParameters: llm.configurations,
				input: langfuseInput,
				startTime: new Date(args.generation.startedAt),
				endTime: new Date(args.generation.failedAt),
				metadata,
				level: "ERROR",
				statusMessage: args.generation.error.message,
			});
			await langfuse.flushAsync();
			return;
		}

		// Handle text generation telemetry
		if (isTextGenerationNode(operationNode)) {
			const usage = args.generation.usage ?? {
				inputTokens: 0,
				outputTokens: 0,
				totalTokens: 0,
			};

			// Calculate costs for token-based models
			const cost = await calculateDisplayCost(llm.provider, llm.id, {
				inputTokens: usage.inputTokens ?? 0,
				outputTokens: usage.outputTokens ?? 0,
			});

			trace.update({
				output: args.generation.outputs,
				tags,
				metadata,
			});

			trace.generation({
				name: generationName,
				model: llm.id,
				modelParameters: llm.configurations,
				input: langfuseInput,
				output: args.generation.outputs,
				usage: {
					unit: "TOKENS",
					input: usage.inputTokens ?? 0,
					output: usage.outputTokens ?? 0,
					total: usage.totalTokens ?? 0,
					inputCost: cost.inputCostForDisplay,
					outputCost: cost.outputCostForDisplay,
					totalCost: cost.totalCostForDisplay,
				},
				startTime: new Date(args.generation.startedAt),
				endTime: new Date(args.generation.completedAt),
				metadata,
				level: "DEFAULT",
			});
		}

		// Handle image generation telemetry
		if (isImageGenerationNode(operationNode)) {
			// Convert output files to Langfuse media references
			const mediaReferences = (args.outputFileBlobs ?? []).map(
				(file) =>
					new LangfuseMedia({
						contentType: file.contentType as ApiMediaContentType,
						contentBytes: Buffer.from(file.bytes),
					}),
			);

			if (mediaReferences.length > 0) {
				trace.update({
					output: mediaReferences,
					tags,
					metadata,
				});

				trace.generation({
					name: generationName,
					model: llm.id,
					modelParameters: llm.configurations,
					input: langfuseInput,
					output: mediaReferences,
					usage: {
						input: 0,
						output: 0,
						total: 0,
						unit: "IMAGES",
					},
					startTime: new Date(args.generation.startedAt),
					endTime: new Date(args.generation.completedAt),
					metadata,
				});
			}
		}

		await langfuse.flushAsync();
	} catch (error) {
		// Log error with context for debugging
		console.error("Telemetry emission failed:", {
			error: error instanceof Error ? error.message : String(error),
			nodeType: args.generation.context.operationNode.content.type,
			generationId: args.generation.id,
		});
	}
}
