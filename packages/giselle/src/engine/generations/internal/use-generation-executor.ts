import type {
	FileId,
	NodeId,
	OutputId,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import type {
	DataContent,
	ImagePart,
	ModelMessage,
	ProviderMetadata,
} from "ai";
import {
	type CompletedGeneration,
	type Generation,
	GenerationContext,
	type GenerationOutput,
	type GenerationUsage,
	isCompletedGeneration,
	isQueuedGeneration,
	type Message,
	type OutputFileBlob,
	type QueuedGeneration,
	type RunningGeneration,
} from "../../../concepts/generation";
import type { ActId } from "../../../concepts/identifiers";
import { UsageLimitError } from "../../error";
import { filePath } from "../../files/utils";
import type { GeneratedImageContentOutput } from "../../generations";
import type { GiselleEngineContext } from "../../types";
import {
	checkUsageLimits,
	getGeneratedImage,
	getGeneration,
	getNodeGenerationIndexes,
	handleAgentTimeConsumption,
	queryResultToText,
} from "../utils";
import { getActGenerationIndexes } from "./get-act-generation-indexes";
import { internalSetGeneration } from "./set-generation";

interface FinishGenerationArgs {
	outputs: GenerationOutput[];
	usage?: GenerationUsage;
	generateMessages?: Message[];
	inputMessages: ModelMessage[];
	providerMetadata?: ProviderMetadata;
}
type FinishGeneration = (args: FinishGenerationArgs) => Promise<{
	completedGeneration: CompletedGeneration;
	outputFileBlobs: OutputFileBlob[];
}>;

export async function useGenerationExecutor<T>(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration | RunningGeneration;
	useExperimentalStorage?: boolean;
	useResumableGeneration?: boolean;
	signal?: AbortSignal;
	execute: (utils: {
		runningGeneration: RunningGeneration;
		generationContext: GenerationContext;
		setGeneration: (generation: Generation) => Promise<void>;
		fileResolver: (fileId: FileId) => Promise<DataContent>;
		generationContentResolver: (
			nodeId: NodeId,
			outputId: OutputId,
		) => Promise<string | undefined>;
		imageGenerationResolver: (
			nodeId: NodeId,
			outputId: OutputId,
		) => Promise<ImagePart[] | undefined>;
		workspaceId: WorkspaceId;
		signal?: AbortSignal;
		finishGeneration: FinishGeneration;
	}) => Promise<T>;
}): Promise<T> {
	const generationContext = GenerationContext.parse(args.generation.context);

	const runningGeneration: RunningGeneration = isQueuedGeneration(
		args.generation,
	)
		? {
				...args.generation,
				status: "running",
				messages: [],
				startedAt: Date.now(),
			}
		: args.generation;

	const setGeneration = async (generation: Generation) => {
		await internalSetGeneration({
			storage: args.context.storage,
			experimental_storage: args.context.experimental_storage,
			useExperimentalStorage: args.useExperimentalStorage,
			generation,
		});
	};

	if (isQueuedGeneration(args.generation)) {
		await setGeneration(runningGeneration);
	}
	let workspaceId: WorkspaceId;
	switch (args.generation.context.origin.type) {
		case "stage":
		case "github-app":
			workspaceId = args.generation.context.origin.workspaceId;
			break;
		case "studio":
			workspaceId = args.generation.context.origin.workspaceId;
			break;
		default: {
			const _exhaustiveCheck: never = args.generation.context.origin;
			throw new Error(`Unhandled origin type: ${_exhaustiveCheck}`);
		}
	}
	const usageLimitCheckStartTime = Date.now();
	const usageLimitStatus = await checkUsageLimits({
		workspaceId,
		generation: args.generation,
		fetchUsageLimitsFn: args.context.fetchUsageLimitsFn,
	});
	args.context.logger.info(
		`Usage limit check completed in ${Date.now() - usageLimitCheckStartTime}ms`,
	);
	if (usageLimitStatus.type === "error") {
		const failedGeneration: Generation = {
			...runningGeneration,
			status: "failed",
			failedAt: Date.now(),
			error: {
				name: usageLimitStatus.error,
				message: usageLimitStatus.error,
				dump: usageLimitStatus,
			},
		} as const;
		await setGeneration(failedGeneration);
		throw new UsageLimitError(usageLimitStatus.error);
	}
	async function fileResolver(fileId: FileId): Promise<DataContent> {
		const fileRetrievalStartTime = Date.now();
		const blob = await args.context.storage.getItemRaw(
			filePath({
				...runningGeneration.context.origin,
				fileId,
			}),
		);
		args.context.logger.info(
			`File retrieval completed in ${Date.now() - fileRetrievalStartTime}ms (fileId: ${fileId})`,
		);
		if (blob === undefined) {
			return new Uint8Array() as DataContent;
		}
		return blob as DataContent;
	}
	function findGeneration(nodeId: NodeId) {
		const actId = runningGeneration.context.origin.actId;
		if (actId === undefined) {
			return findGenerationByNode(nodeId);
		}
		return findGenerationByAct(nodeId, actId);
	}
	async function findGenerationByNode(nodeId: NodeId) {
		const generationLookupStartTime = Date.now();
		const nodeGenerationIndexes = await getNodeGenerationIndexes({
			storage: args.context.storage,
			experimental_storage: args.context.experimental_storage,
			useExperimentalStorage: args.useExperimentalStorage,
			nodeId,
		});
		if (
			nodeGenerationIndexes === undefined ||
			nodeGenerationIndexes.length === 0
		) {
			args.context.logger.info(
				`Generation lookup by node completed in ${Date.now() - generationLookupStartTime}ms (nodeId: ${nodeId}, found: false)`,
			);
			return undefined;
		}
		const generation = await getGeneration({
			storage: args.context.storage,
			experimental_storage: args.context.experimental_storage,
			useExperimentalStorage: args.useExperimentalStorage,
			generationId: nodeGenerationIndexes[nodeGenerationIndexes.length - 1].id,
		});
		args.context.logger.info(
			`Generation lookup by node completed in ${Date.now() - generationLookupStartTime}ms (nodeId: ${nodeId}, found: true)`,
		);
		return generation;
	}
	async function findGenerationByAct(nodeId: NodeId, actId: ActId) {
		const actGenerationLookupStartTime = Date.now();
		const actGenerationIndexes = await getActGenerationIndexes({
			experimental_storage: args.context.experimental_storage,
			actId,
		});
		const targetGenerationIndex = actGenerationIndexes?.find(
			(actGenerationIndex) => actGenerationIndex.nodeId === nodeId,
		);
		if (targetGenerationIndex === undefined) {
			args.context.logger.info(
				`Generation lookup by act completed in ${Date.now() - actGenerationLookupStartTime}ms (nodeId: ${nodeId}, actId: ${actId}, found: false)`,
			);
			return undefined;
		}
		const generation = await getGeneration({
			storage: args.context.storage,
			experimental_storage: args.context.experimental_storage,
			useExperimentalStorage: args.useExperimentalStorage,
			generationId: targetGenerationIndex.id,
		});
		args.context.logger.info(
			`Generation lookup by act completed in ${Date.now() - actGenerationLookupStartTime}ms (nodeId: ${nodeId}, actId: ${actId}, found: true)`,
		);
		return generation;
	}
	function findOutput(outputId: OutputId) {
		for (const sourceNode of runningGeneration.context.sourceNodes) {
			for (const sourceOutput of sourceNode.outputs) {
				if (sourceOutput.id === outputId) {
					return sourceOutput;
				}
			}
		}
		return undefined;
	}
	async function generationContentResolver(nodeId: NodeId, outputId: OutputId) {
		function formatGenerationOutput(generationOutput: GenerationOutput) {
			switch (generationOutput.type) {
				case "source":
					return JSON.stringify(generationOutput.sources);
				case "generated-text":
					return generationOutput.content;
				case "query-result":
					return queryResultToText(generationOutput);
				default:
					throw new Error("Generation output type is not supported");
			}
		}

		const generation = await findGeneration(nodeId);
		if (generation === undefined || !isCompletedGeneration(generation)) {
			return undefined;
		}

		const output = findOutput(outputId);
		if (output === undefined) {
			return undefined;
		}

		const generationOutput = generation.outputs.find(
			(o) => o.outputId === outputId,
		);
		if (generationOutput === undefined) {
			return undefined;
		}

		return formatGenerationOutput(generationOutput);
	}
	async function imageGenerationResolver(
		nodeId: NodeId,
		outputId: OutputId,
	): Promise<ImagePart[] | undefined> {
		const generation = await findGeneration(nodeId);
		if (generation === undefined || !isCompletedGeneration(generation)) {
			return undefined;
		}

		const output = findOutput(outputId);
		if (output === undefined) {
			return undefined;
		}

		const imageGenerationOutput = generation.outputs.find(
			(o): o is GeneratedImageContentOutput =>
				o.type === "generated-image" && o.outputId === outputId,
		);

		if (imageGenerationOutput === undefined) {
			return undefined;
		}

		const imageParts = await Promise.all(
			imageGenerationOutput.contents.map(async (content) => {
				try {
					const image = await getGeneratedImage({
						storage: args.context.storage,
						experimental_storage: args.context.experimental_storage,
						useExperimentalStorage: args.useExperimentalStorage,
						generation,
						filename: content.filename,
					});

					return {
						type: "image",
						image,
						mediaType: content.contentType,
					} satisfies ImagePart;
				} catch (error) {
					args.context.logger.error(
						error instanceof Error ? error : new Error(String(error)),
						`Failed to load generated image: ${content.filename}`,
					);
					return undefined;
				}
			}),
		).then((results) => results.filter((result) => result !== undefined));

		return imageParts.length > 0 ? imageParts : undefined;
	}

	async function finishGeneration({
		outputs,
		usage,
		inputMessages,
		generateMessages,
		providerMetadata,
	}: FinishGenerationArgs) {
		const completionStartTime = Date.now();
		const completedGeneration = {
			...runningGeneration,
			status: "completed",
			completedAt: Date.now(),
			outputs,
			usage,
			messages: generateMessages ?? [],
		} satisfies CompletedGeneration;

		/** @todo create type alias */
		const outputFileBlobs: OutputFileBlob[] = [];
		const imageProcessingStartTime = Date.now();
		for (const output of outputs) {
			if (output.type !== "generated-image") {
				continue;
			}
			for (const content of output.contents) {
				const bytes = await getGeneratedImage({
					storage: args.context.storage,
					experimental_storage: args.context.experimental_storage,
					generation: args.generation,
					filename: content.filename,
					useExperimentalStorage: true,
				});

				outputFileBlobs.push({
					id: content.id,
					outputId: output.outputId,
					contentType: content.contentType,
					bytes,
				});
			}
		}
		args.context.logger.info(
			`Image processing completed in ${Date.now() - imageProcessingStartTime}ms (${outputFileBlobs.length} images)`,
		);

		const finalProcessingStartTime = Date.now();
		await Promise.all([
			setGeneration(completedGeneration),
			handleAgentTimeConsumption({
				workspaceId,
				generation: completedGeneration,
				onConsumeAgentTime: args.context.onConsumeAgentTime,
			}),
			(async () => {
				const result = await args.context.callbacks?.generationComplete?.({
					generation: completedGeneration,
					inputMessages,
					outputFileBlobs,
					providerMetadata,
				});
				return result;
			})(),
		]);
		args.context.logger.info(
			`Final processing completed in ${Date.now() - finalProcessingStartTime}ms`,
		);
		args.context.logger.info(
			`Generation completion total time: ${Date.now() - completionStartTime}ms`,
		);
		return { completedGeneration, outputFileBlobs };
	}

	return args.execute({
		runningGeneration,
		generationContext,
		setGeneration,
		fileResolver,
		generationContentResolver,
		imageGenerationResolver,
		workspaceId,
		signal: args.signal,
		finishGeneration,
	});
}
