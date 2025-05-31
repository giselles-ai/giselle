import { Generation, type NodeGenerationIndex } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import {
	generationPath,
	getNodeGenerationIndexes,
	nodeGenerationIndexPath,
} from "../utils";

export async function internalSetGeneration(params: {
	storage: Storage;
	generation: Generation;
}) {
	await params.storage.setItem(
		generationPath(params.generation.id),
		Generation.parse(params.generation),
	);
	let newNodeGenerationIndexes: NodeGenerationIndex[] | undefined;
	const newNodeGenerationIndex = toNodeGenerationIndex(params.generation);
	const nodeId = params.generation.context.operationNode.id;
	const currentNodeGenerationIndexes = await getNodeGenerationIndexes({
		storage: params.storage,
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
	await params.storage.setItem(
		nodeGenerationIndexPath(nodeId),
		newNodeGenerationIndexes,
	);
}

export function toNodeGenerationIndex(
	generation: Generation,
): NodeGenerationIndex {
	return {
		id: generation.id,
		nodeId: generation.context.operationNode.id,
		status: generation.status,
		createdAt: generation.createdAt,
		queuedAt: generation.queuedAt,
		startedAt: generation.startedAt,
		completedAt: generation.completedAt,
		failedAt: generation.failedAt,
		cancelledAt: generation.cancelledAt,
	};
}
