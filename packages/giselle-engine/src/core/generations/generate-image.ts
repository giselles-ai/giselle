import { fal } from "@ai-sdk/fal";
import { openai } from "@ai-sdk/openai";
import {
	type GenerationContext,
	type GenerationOutput,
	type Image,
	type ImageGenerationNode,
	ImageId,
	isImageGenerationNode,
	type OpenAIImageLanguageModelData,
	type QueuedGeneration,
	type RunningGeneration,
} from "@giselle-sdk/data-type";
import {
	createUsageCalculator,
	type GeneratedImageData,
} from "@giselle-sdk/language-model";
import {
	type CoreMessage,
	experimental_generateImage as generateImageAiSdk,
} from "ai";
import { type ApiMediaContentType, Langfuse, LangfuseMedia } from "langfuse";
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
}) {
	return useGenerationExecutor({
		context: args.context,
		generation: args.generation,
		telemetry: args.telemetry,
		execute: async ({
			runningGeneration,
			generationContext,
			fileResolver,
			generationContentResolver,
			completeGeneration,
		}) => {
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
}: {
	operationNode: ImageGenerationNode;
	generationContext: GenerationContext;
	runningGeneration: RunningGeneration;
	messages: CoreMessage[];
	telemetry?: TelemetrySettings;
	tracer: Langfuse;
	context: GiselleEngineContext;
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

export async function generateImageWithOpenAI({
	messages,
	generationContext,
	runningGeneration,
	languageModelData,
	context,
	tracer,
	telemetry,
}: {
	messages: CoreMessage[];
	generationContext: GenerationContext;
	runningGeneration: RunningGeneration;
	languageModelData: OpenAIImageLanguageModelData;
	context: GiselleEngineContext;
	tracer: Langfuse;
	telemetry?: TelemetrySettings;
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
