import type {
	FileId,
	NodeId,
	Output,
	OutputId,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import type { DataContent, ModelMessage } from "ai";
import {
	type CompletedGeneration,
	type Generation,
	GenerationContext,
	type GenerationOutput,
	type GenerationUsage,
	isCompletedGeneration,
	type Message,
	type OutputFileBlob,
	type QueuedGeneration,
	type RunningGeneration,
} from "../../../concepts/generation";
import { UsageLimitError } from "../../error";
import { filePath } from "../../files/utils";
import type { GiselleEngineContext } from "../../types";
import {
	checkUsageLimits,
	getGeneratedImage,
	getGeneration,
	getNodeGenerationIndexes,
	handleAgentTimeConsumption,
	queryResultToText,
} from "../utils";
import { internalSetGeneration } from "./set-generation";

interface CompleteGenerationArgs {
	outputs: GenerationOutput[];
	usage?: GenerationUsage;
	generateMessages?: Message[];
	inputMessages: ModelMessage[];
}
type CompleteGeneration = (
	args: CompleteGenerationArgs,
) => Promise<CompletedGeneration>;

export async function useGenerationExecutor<T>(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	useExperimentalStorage?: boolean;
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
		workspaceId: WorkspaceId;
		signal?: AbortSignal;
		completeGeneration: CompleteGeneration;
	}) => Promise<T>;
}): Promise<T> {
	const generationContext = GenerationContext.parse(args.generation.context);
	const runningGeneration: RunningGeneration = {
		...args.generation,
		status: "running",
		messages: [],
		startedAt: Date.now(),
	};
	const setGeneration = async (generation: Generation) => {
		await internalSetGeneration({
			storage: args.context.storage,
			experimental_storage: args.context.experimental_storage,
			useExperimentalStorage: args.useExperimentalStorage,
			generation,
		});
	};
	await setGeneration(runningGeneration);
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
	const usageLimitStatus = await checkUsageLimits({
		workspaceId,
		generation: args.generation,
		fetchUsageLimitsFn: args.context.fetchUsageLimitsFn,
	});
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
		const blob = await args.context.storage.getItemRaw(
			filePath({
				...runningGeneration.context.origin,
				fileId,
			}),
		);
		if (blob === undefined) {
			return new Uint8Array() as DataContent;
		}
		return blob as DataContent;
	}
	async function generationContentResolver(nodeId: NodeId, outputId: OutputId) {
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
			return undefined;
		}
		const generation = await getGeneration({
			storage: args.context.storage,
			experimental_storage: args.context.experimental_storage,
			useExperimentalStorage: args.useExperimentalStorage,
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
			(o) => o.outputId === outputId,
		);
		if (generationOutput === undefined) {
			return undefined;
		}
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

	async function completeGeneration({
		outputs,
		usage,
		inputMessages,
		generateMessages,
	}: CompleteGenerationArgs) {
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
				});
				return result;
			})(),
		]);
		return completedGeneration;
	}

	return args.execute({
		runningGeneration,
		generationContext,
		setGeneration,
		fileResolver,
		generationContentResolver,
		workspaceId,
		signal: args.signal,
		completeGeneration,
	});
}
