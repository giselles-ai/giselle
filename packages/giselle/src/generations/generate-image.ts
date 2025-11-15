import { fal } from "@ai-sdk/fal";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { GeneratedImageData } from "@giselles-ai/language-model";
import {
	type FailedGeneration,
	type FalLanguageModelData,
	type GenerationContext,
	type GenerationOutput,
	type GoogleImageLanguageModelData,
	type Image,
	type ImageGenerationNode,
	ImageId,
	isImageGenerationNode,
	type OpenAIImageLanguageModelData,
	type QueuedGeneration,
	type RunningGeneration,
} from "@giselles-ai/protocol";
import {
	experimental_generateImage as generateImageAiSdk,
	generateText,
	type ModelMessage,
} from "ai";
import type { GiselleContext } from "../types";
import { useGenerationExecutor } from "./internal/use-generation-executor";
import {
	buildMessageObject,
	detectImageType,
	setGeneratedImage,
} from "./utils";

export function generateImage(args: {
	context: GiselleContext;
	generation: QueuedGeneration;
	signal?: AbortSignal;
}) {
	return useGenerationExecutor({
		context: args.context,
		generation: args.generation,
		signal: args.signal,
		execute: async ({
			runningGeneration,
			generationContext,
			fileResolver,
			generationContentResolver,
			imageGenerationResolver,
			appEntryResolver,
			finishGeneration,
			setGeneration,
			signal,
		}) => {
			try {
				const operationNode = generationContext.operationNode;
				if (!isImageGenerationNode(operationNode)) {
					throw new Error("Invalid generation type");
				}

				const messages = await buildMessageObject({
					node: operationNode,
					contextNodes: generationContext.sourceNodes,
					fileResolver,
					generationContentResolver,
					imageGenerationResolver,
					appEntryResolver,
				});

				let generationOutputs: GenerationOutput[] = [];
				switch (operationNode.content.llm.provider) {
					case "fal":
						generationOutputs = await generateImageWithFal({
							operationNode,
							messages,
							runningGeneration,
							generationContext,
							languageModelData: operationNode.content.llm,
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
							signal,
						});
						break;
					case "google":
						generationOutputs = await generateImageWithGoogle({
							messages,
							runningGeneration,
							generationContext,
							languageModelData: operationNode.content.llm,
							context: args.context,
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

				await finishGeneration({
					inputMessages: messages,
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

async function generateImageWithFal({
	operationNode,
	generationContext,
	runningGeneration,
	messages,
	context,
	languageModelData,
	signal,
}: {
	operationNode: ImageGenerationNode;
	generationContext: GenerationContext;
	runningGeneration: RunningGeneration;
	messages: ModelMessage[];
	context: GiselleContext;
	languageModelData: FalLanguageModelData;
	signal?: AbortSignal;
}) {
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
		n: languageModelData.configurations.n,
		size: languageModelData.configurations.size,
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

	return generationOutputs;
}

async function generateImageWithOpenAI({
	messages,
	generationContext,
	runningGeneration,
	languageModelData,
	context,
	signal,
}: {
	messages: ModelMessage[];
	generationContext: GenerationContext;
	runningGeneration: RunningGeneration;
	languageModelData: OpenAIImageLanguageModelData;
	context: GiselleContext;
	signal?: AbortSignal;
}) {
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

	return generationOutputs;
}

async function generateImageWithGoogle({
	messages,
	generationContext,
	runningGeneration,
	languageModelData,
	context,
	signal,
}: {
	messages: ModelMessage[];
	generationContext: GenerationContext;
	runningGeneration: RunningGeneration;
	languageModelData: GoogleImageLanguageModelData;
	context: GiselleContext;
	signal?: AbortSignal;
}) {
	const { files } = await generateText({
		model: google(languageModelData.id),
		providerOptions: {
			google: languageModelData.configurations,
		},
		abortSignal: signal,
		messages,
	});

	const images = files.filter((file) => file.mediaType.startsWith("image/"));
	const generatedImageOutput = generationContext.operationNode.outputs.find(
		(output) => output.accessor === "generated-image",
	);
	const generationOutputs: GenerationOutput[] = [];
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

	return generationOutputs;
}
