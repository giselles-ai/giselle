import { fal } from "@ai-sdk/fal";
import { openai } from "@ai-sdk/openai";
import {
	type ImageGenerationNode,
	isImageGenerationNode,
	type OpenAIImageLanguageModelData,
} from "@giselle-sdk/data-type";
import {
	createUsageCalculator,
	type GeneratedImageData,
} from "@giselle-sdk/language-model";
import {
	experimental_generateImage as generateImageAiSdk,
	type ModelMessage,
} from "ai";
import { type ApiMediaContentType, Langfuse, LangfuseMedia } from "langfuse";
import {
	type FailedGeneration,
	type GenerationContext,
	type GenerationOutput,
	type Image,
	ImageId,
	type QueuedGeneration,
	type RunningGeneration,
} from "../../concepts/generation";
import type { GiselleEngineContext } from "../types";
import { useGenerationExecutor } from "./internal/use-generation-executor";
import type { TelemetrySettings } from "./types";
import {
	buildMessageObject,
	detectImageType,
	setGeneratedImage,
} from "./utils";

export function generateImage(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	telemetry?: TelemetrySettings;
	useExperimentalStorage: boolean;
	signal?: AbortSignal;
}) {
	return useGenerationExecutor({
		context: args.context,
		generation: args.generation,
		telemetry: args.telemetry,
		useExperimentalStorage: args.useExperimentalStorage,
		signal: args.signal,
		execute: async ({
			runningGeneration,
			generationContext,
			fileResolver,
			generationContentResolver,
			completeGeneration,
			setGeneration,
			signal,
		}) => {
			try {
				const operationNode = generationContext.operationNode;
				if (!isImageGenerationNode(operationNode)) {
					throw new Error("Invalid generation type");
				}

				const tracer = new Langfuse();
				const messages = await buildMessageObject(
					operationNode,
					generationContext.sourceNodes,
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
							tracer,
							telemetry: args.telemetry,
							context: args.context,
							signal,
						});
						break;
					case "openai":
						generationOutputs = await generateImageWithOpenAI({
							messages,
							runningGeneration,
							generationContext,
							languageModelData: operationNode.content.llm,
							context: args.context,
							tracer,
							telemetry: args.telemetry,
							signal,
						});
						break;
					default: {
						const _exhaustiveCheck: never = operationNode.content.llm;
						throw new Error(
							`Unhandled generation output type: ${_exhaustiveCheck}`,
						);
					}
				}

				await completeGeneration({
					outputs: generationOutputs,
				});
			} catch (error) {
				if (error instanceof Error && error.name === "ResponseAborted") {
					return;
				}
				
				const failedGeneration = {
					...runningGeneration,
					status: "failed",
					failedAt: Date.now(),
					error: {
						name: error instanceof Error ? error.name : "UnknownError",
						message: error instanceof Error ? error.message : String(error),
						dump: error,
					},
				} satisfies FailedGeneration;
				
				await setGeneration(failedGeneration);
        throw error;
			}
		},
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
	tracer,
	telemetry,
	context,
	useExperimentalStorage,
	signal,
}: {
	operationNode: ImageGenerationNode;
	generationContext: GenerationContext;
	runningGeneration: RunningGeneration;
	messages: ModelMessage[];
	telemetry?: TelemetrySettings;
	tracer: Langfuse;
	context: GiselleEngineContext;
	useExperimentalStorage?: boolean;
	signal?: AbortSignal;
}) {
	const trace = tracer.trace({
		name: "ai-sdk/fal",
		metadata: telemetry?.metadata,
		input: { messages },
		tags: ["deprecated"],
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
		abortSignal: signal,
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
					experimental_storage: context.experimental_storage,
					useExperimentalStorage,
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
			...result.images.map((image) => {
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
			(() => {
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

async function generateImageWithOpenAI({
	messages,
	generationContext,
	runningGeneration,
	languageModelData,
	context,
	tracer,
	telemetry,
	useExperimentalStorage,
	signal,
}: {
	messages: ModelMessage[];
	generationContext: GenerationContext;
	runningGeneration: RunningGeneration;
	languageModelData: OpenAIImageLanguageModelData;
	context: GiselleEngineContext;
	tracer: Langfuse;
	telemetry?: TelemetrySettings;
	useExperimentalStorage?: boolean;
	signal?: AbortSignal;
}) {
	const trace = tracer.trace({
		name: "ai-sdk/openai",
		metadata: telemetry?.metadata,
		input: { messages },
		tags: ["deprecated"],
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
		abortSignal: signal,
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
					experimental_storage: context.experimental_storage,
					useExperimentalStorage,
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
			...images.map((image) => {
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
			(() => {
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
