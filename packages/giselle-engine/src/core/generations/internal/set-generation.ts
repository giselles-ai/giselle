import { Generation, NodeGenerationIndex } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import type { GiselleStorage } from "../../experimental_storage";
import {
	generationPath,
	getNodeGenerationIndexes,
	nodeGenerationIndexPath,
} from "../utils";

export async function internalSetGeneration(params: {
	storage: Storage;
	experimental_storage: GiselleStorage;
	useExperimentalStorage?: boolean;
	generation: Generation;
}) {
	if (params.useExperimentalStorage) {
		await params.experimental_storage.setJson({
			path: generationPath(params.generation.id),
			data: params.generation,
			schema: Generation,
		});
	} else {
		await params.storage.setItem(
			generationPath(params.generation.id),
			Generation.parse(params.generation),
		);
	}
	let newNodeGenerationIndexes: NodeGenerationIndex[] | undefined;
	const newNodeGenerationIndex = toNodeGenerationIndex(params.generation);
	const nodeId = params.generation.context.operationNode.id;
	const currentNodeGenerationIndexes = await getNodeGenerationIndexes({
		storage: params.storage,
		experimental_storage: params.experimental_storage,
		useExperimentalStorage: params.useExperimentalStorage,
		nodeId,
	});

	if (currentNodeGenerationIndexes === undefined) {
		newNodeGenerationIndexes = [newNodeGenerationIndex];
	} else {
		const index = currentNodeGenerationIndexes.findIndex(
			(nodeGenerationIndex) => nodeGenerationIndex.id === params.generation.id,
		);
		if (index === -1) {
			newNodeGenerationIndexes = [
				...currentNodeGenerationIndexes,
				newNodeGenerationIndex,
			];
		} else {
			newNodeGenerationIndexes = [
				...currentNodeGenerationIndexes.slice(0, index),
				newNodeGenerationIndex,
				...currentNodeGenerationIndexes.slice(index + 1),
			];
		}
	}
	if (params.useExperimentalStorage) {
		await params.experimental_storage.setJson({
			path: nodeGenerationIndexPath(nodeId),
			data: newNodeGenerationIndexes,
			schema: NodeGenerationIndex.array(),
		});
	} else {
		await params.storage.setItem(
			nodeGenerationIndexPath(nodeId),
			newNodeGenerationIndexes,
		);
	}
}

function toNodeGenerationIndex(generation: Generation): NodeGenerationIndex {
	return {
		id: generation.id,
		nodeId: generation.context.operationNode.id,
		status: generation.status,
		createdAt: generation.createdAt,
		queuedAt: "queuedAt" in generation ? generation.queuedAt : undefined,
		startedAt: "startedAt" in generation ? generation.startedAt : undefined,
		completedAt:
			"completedAt" in generation ? generation.completedAt : undefined,
		failedAt: "failedAt" in generation ? generation.failedAt : undefined,
		cancelledAt:
			"cancelledAt" in generation ? generation.cancelledAt : undefined,
	};
}
