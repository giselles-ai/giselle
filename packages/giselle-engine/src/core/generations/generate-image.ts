import { fal } from "@ai-sdk/fal";
import { openai } from "@ai-sdk/openai";
import {
	type CompletedGeneration,
	type FailedGeneration,
	type FileData,
	GenerationContext,
	type GenerationOutput,
	type Image,
	type ImageGenerationNode,
	ImageId,
	type NodeId,
	type OpenAIImageLanguageModelData,
	type Output,
	type OutputId,
	type QueuedGeneration,
	type RunningGeneration,
	type WorkspaceId,
	isCompletedGeneration,
	isImageGenerationNode,
} from "@giselle-sdk/data-type";
import {
	type GeneratedImageData,
	createUsageCalculator,
} from "@giselle-sdk/language-model";
import {
	type CoreMessage,
	experimental_generateImage as generateImageAiSdk,
} from "ai";
import { type ApiMediaContentType, Langfuse, LangfuseMedia } from "langfuse";
import { UsageLimitError } from "../error";
import { filePath } from "../files/utils";
import type { GiselleEngineContext } from "../types";
import { internalSetGeneration } from "./internal/set-generation";
import type { TelemetrySettings } from "./types";
import {
	buildMessageObject,
	checkUsageLimits,
	detectImageType,
	getGeneration,
	getNodeGenerationIndexes,
	handleAgentTimeConsumption,
	queryResultToText,
	setGeneratedImage,
} from "./utils";

export async function generateImage(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	telemetry?: TelemetrySettings;
}) {
	const operationNode = args.generation.context.operationNode;
	if (!isImageGenerationNode(operationNode)) {
		throw new Error("Invalid generation type");
	}
	const langfuse = new Langfuse();
	const generationContext = GenerationContext.parse(args.generation.context);
	const runningGeneration = {
		...args.generation,
		status: "running",
		messages: [],
		queuedAt: Date.now(),
		startedAt: Date.now(),
	} satisfies RunningGeneration;

	internalSetGeneration({
		storage: args.context.storage,
		generation: runningGeneration,
	});

	let workspaceId: WorkspaceId | undefined;
	switch (args.generation.context.origin.type) {
		case "run":
			workspaceId = args.generation.context.origin.workspaceId;
			break;
		case "workspace":
			workspaceId = args.generation.context.origin.id;
			break;
		default: {
			const _exhaustiveCheck: never = args.generation.context.origin;
			throw new Error(`Unhandled origin type: ${_exhaustiveCheck}`);
		}
	}
	const usageLimitStatus = await checkUsageLimits({
		workspaceId,
		generation: args.generation,
		fetchUsageLimitsFn: args.context.fetchUsageLimitsFn,
	});
	if (usageLimitStatus.type === "error") {
		const failedGeneration = {
			...runningGeneration,
			status: "failed",
			failedAt: Date.now(),
			error: {
				name: usageLimitStatus.error,
				message: usageLimitStatus.error,
				dump: usageLimitStatus,
			},
		} satisfies FailedGeneration;
		internalSetGeneration({
			storage: args.context.storage,
			generation: failedGeneration,
		});
		throw new UsageLimitError(usageLimitStatus.error);
	}

	async function fileResolver(file: FileData) {
		const blob = await args.context.storage.getItemRaw(
			filePath({
				...runningGeneration.context.origin,
				fileId: file.id,
			}),
		);
		if (blob === undefined) {
			return undefined;
		}
		return blob;
	}

	async function generationContentResolver(nodeId: NodeId, outputId: OutputId) {
		const nodeGenerationIndexes = await getNodeGenerationIndexes({
			storage: args.context.storage,
			nodeId,
		});
		if (
			nodeGenerationIndexes === undefined ||
			nodeGenerationIndexes.length === 0
		) {
			return undefined;
		}
		const generation = await getGeneration({
			...args,
			storage: args.context.storage,
			generationId: nodeGenerationIndexes[nodeGenerationIndexes.length - 1].id,
		});
		if (generation === undefined || !isCompletedGeneration(generation)) {
			return undefined;
		}
		let output: Output | undefined;
		for (const sourceNode of runningGeneration.context.sourceNodes) {
			for (const sourceOutput of sourceNode.outputs) {
				if (sourceOutput.id === outputId) {
					output = sourceOutput;
					break;
				}
			}
		}
		if (output === undefined) {
			return undefined;
		}
		const generationOutput = generation.outputs.find(
			(output) => output.outputId === outputId,
		);
		if (generationOutput === undefined) {
			return undefined;
		}
		switch (generationOutput.type) {
			case "source":
				return JSON.stringify(generationOutput.sources);
			case "reasoning":
				throw new Error("Generation output type is not supported");
			case "generated-image":
				throw new Error("Generation output type is not supported");
			case "generated-text":
				return generationOutput.content;
			case "query-result":
				return queryResultToText(generationOutput);
			default: {
				const _exhaustiveCheck: never = generationOutput;
				throw new Error(
					`Unhandled generation output type: ${_exhaustiveCheck}`,
				);
			}
		}
	}
	const messages = await buildMessageObject(
		operationNode,
		runningGeneration.context.sourceNodes,
		fileResolver,
		generationContentResolver,
	);

	let generationOutputs: GenerationOutput[] = [];
	switch (operationNode.content.llm.provider) {
		case "fal":
			generationOutputs = await generateImageWithFal({
				operationNode,
				messages,
				runningGeneration,
				generationContext,
				langfuse,
				telemetry: args.telemetry,
				context: args.context,
			});
			break;
		case "openai":
			generationOutputs = await generateImageWithOpenAI({
				messages,
				runningGeneration,
				generationContext,
				languageModelData: operationNode.content.llm,
				context: args.context,
				langfuse,
				telemetry: args.telemetry,
			});
			break;
		default: {
			const _exhaustiveCheck: never = operationNode.content.llm;
			throw new Error(`Unhandled generation output type: ${_exhaustiveCheck}`);
		}
	}
	const completedGeneration = {
		...runningGeneration,
		status: "completed",
		messages: [],
		completedAt: Date.now(),
		outputs: generationOutputs,
	} satisfies CompletedGeneration;

	internalSetGeneration({
		storage: args.context.storage,
		generation: completedGeneration,
	});

	await handleAgentTimeConsumption({
		workspaceId,
		generation: completedGeneration,
		onConsumeAgentTime: args.context.onConsumeAgentTime,
	});
}

function imageDimStringToSize(size: string): { width: number; height: number } {
	const [width, height] = size.split("x").map(Number);
	if (Number.isNaN(width) || Number.isNaN(height)) {
		throw new Error(`Invalid image size format: ${size}`);
	}
	return { width, height };
}

async function generateImageWithFal({
	operationNode,
	generationContext,
	runningGeneration,
	messages,
	langfuse,
	telemetry,
	context,
}: {
	operationNode: ImageGenerationNode;
	generationContext: GenerationContext;
	runningGeneration: RunningGeneration;
	messages: CoreMessage[];
	telemetry?: TelemetrySettings;
	langfuse: Langfuse;
	context: GiselleEngineContext;
}) {
	const trace = langfuse.trace({
		name: "ai-sdk/fal",
		metadata: telemetry?.metadata,
		input: { messages },
	});
	const generation = trace.generation({
		name: "ai-sdk/fal.generateImage",
		model: operationNode.content.llm.id,
		modelParameters: operationNode.content.llm.configurations,
		input: { messages },
		usage: {
			input: 0,
			output: 0,
			unit: "IMAGES",
		},
	});

	let prompt = "";
	for (const message of messages) {
		if (!Array.isArray(message.content)) {
			continue;
		}
		for (const content of message.content) {
			if (content.type !== "text") {
				continue;
			}
			prompt += content.text;
		}
	}

	const result = await generateImageAiSdk({
		model: fal.image(operationNode.content.llm.id),
		prompt,
		n: operationNode.content.llm.configurations.n,
		size: operationNode.content.llm.configurations.size,
	});

	const generationOutputs: GenerationOutput[] = [];

	const generatedImageOutput = generationContext.operationNode.outputs.find(
		(output) => output.accessor === "generated-image",
	);
	if (generatedImageOutput !== undefined) {
		const contents = await Promise.all(
			result.images.map(async (image) => {
				const imageType = detectImageType(image.uint8Array);
				if (imageType === null) {
					return null;
				}
				const id = ImageId.generate();
				const filename = `${id}.${imageType.ext}`;

				await setGeneratedImage({
					storage: context.storage,
					generation: runningGeneration,
					generatedImage: {
						uint8Array: image.uint8Array,
						base64: image.base64,
					} satisfies GeneratedImageData,
					generatedImageFilename: filename,
				});

				return {
					id,
					contentType: imageType.contentType,
					filename,
					pathname: `/generations/${runningGeneration.id}/generated-images/${filename}`,
				} satisfies Image;
			}),
		).then((results) => results.filter((result) => result !== null));

		generationOutputs.push({
			type: "generated-image",
			contents,
			outputId: generatedImageOutput.id,
		});
	}

	if (context.telemetry?.isEnabled && generatedImageOutput) {
		const usageCalculator = createUsageCalculator(operationNode.content.llm.id);
		const imageSize = imageDimStringToSize(
			operationNode.content.llm.configurations.size,
		);
		await Promise.all([
			...result.images.map(async (image) => {
				const wrappedMedia = new LangfuseMedia({
					contentType: "image/png" as ApiMediaContentType,
					contentBytes: Buffer.from(image.uint8Array),
				});

				generation.update({
					metadata: {
						context: wrappedMedia,
					},
				});
			}),
			(async () => {
				const usage = usageCalculator.calculateUsage({
					...imageSize,
					n: operationNode.content.llm.configurations.n,
				});
				generation.update({
					usage,
				});
				generation.end();
			})(),
		]);
	}
	return generationOutputs;
}

export async function generateImageWithOpenAI({
	messages,
	generationContext,
	runningGeneration,
	languageModelData,
	context,
	langfuse,
	telemetry,
}: {
	messages: CoreMessage[];
	generationContext: GenerationContext;
	runningGeneration: RunningGeneration;
	languageModelData: OpenAIImageLanguageModelData;
	context: GiselleEngineContext;
	langfuse: Langfuse;
	telemetry?: TelemetrySettings;
}) {
	const trace = langfuse.trace({
		name: "ai-sdk/openai",
		metadata: telemetry?.metadata,
		input: { messages },
	});
	const generation = trace.generation({
		name: "ai-sdk/openai.generateImage",
		model: languageModelData.id,
		modelParameters: languageModelData.configurations,
		input: { messages },
		usage: {
			input: 0,
			output: 0,
			unit: "IMAGES",
		},
	});

	let prompt = "";
	for (const message of messages) {
		if (!Array.isArray(message.content)) {
			continue;
		}
		for (const content of message.content) {
			if (content.type !== "text") {
				continue;
			}
			prompt += content.text;
		}
	}
	const { images } = await generateImageAiSdk({
		model: openai.image("gpt-image-1"),
		prompt,
		n: languageModelData.configurations.n,
		size: languageModelData.configurations.size,
		providerOptions: {
			openai: {
				...languageModelData.configurations,
			},
		},
	});
	const generationOutputs: GenerationOutput[] = [];

	const generatedImageOutput = generationContext.operationNode.outputs.find(
		(output) => output.accessor === "generated-image",
	);
	if (generatedImageOutput !== undefined) {
		const contents = await Promise.all(
			images.map(async (image) => {
				const imageType = detectImageType(image.uint8Array);
				if (imageType === null) {
					return null;
				}
				const id = ImageId.generate();
				const filename = `${id}.${imageType.ext}`;

				await setGeneratedImage({
					storage: context.storage,
					generation: runningGeneration,
					generatedImage: {
						uint8Array: image.uint8Array,
						base64: image.base64,
					} satisfies GeneratedImageData,
					generatedImageFilename: filename,
				});

				return {
					id,
					contentType: imageType.contentType,
					filename,
					pathname: `/generations/${runningGeneration.id}/generated-images/${filename}`,
				} satisfies Image;
			}),
		).then((results) => results.filter((result) => result !== null));

		generationOutputs.push({
			type: "generated-image",
			contents,
			outputId: generatedImageOutput.id,
		});
	}

	if (context.telemetry?.isEnabled && generatedImageOutput) {
		const usageCalculator = createUsageCalculator(languageModelData.id);
		const imageSize = imageDimStringToSize(
			languageModelData.configurations.size,
		);
		await Promise.all([
			...images.map(async (image) => {
				const wrappedMedia = new LangfuseMedia({
					contentType: "image/png" as ApiMediaContentType,
					contentBytes: Buffer.from(image.uint8Array),
				});

				generation.update({
					metadata: {
						context: wrappedMedia,
					},
				});
			}),
			(async () => {
				const usage = usageCalculator.calculateUsage({
					...imageSize,
					quality: languageModelData.configurations.quality,
				});
				generation.update({
					usage,
				});
				generation.end();
			})(),
		]);
	}
	return generationOutputs;
}
