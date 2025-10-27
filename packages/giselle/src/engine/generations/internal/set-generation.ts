import type { NodeId } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import { Generation, NodeGenerationIndex } from "../../../concepts/generation";
import type { GiselleLogger } from "../../../logger/types";
import type { GiselleStorage } from "../../experimental_storage";
import {
	generationPath,
	getNodeGenerationIndexes,
	nodeGenerationIndexPath,
} from "../utils";
import { updateActGenerationIndexes } from "./act-generation-index-queue";

function upsertIndex(
	current: NodeGenerationIndex[] | undefined,
	incoming: NodeGenerationIndex,
) {
	if (!current) return [incoming];
	const pos = current.findIndex((i) => i.id === incoming.id);
	if (pos === -1) return [...current, incoming];
	return [...current.slice(0, pos), incoming, ...current.slice(pos + 1)];
}

export async function internalSetGeneration(params: {
	deprecated_storage: Storage;
	storage: GiselleStorage;
	useExperimentalStorage?: boolean;
	generation: Generation;
	logger?: GiselleLogger;
}) {
	if (params.useExperimentalStorage) {
		await params.storage.setJson({
			path: generationPath(params.generation.id),
			data: params.generation,
			schema: Generation,
		});
	} else {
		await params.deprecated_storage.setItem(
			generationPath(params.generation.id),
			Generation.parse(params.generation),
		);
	}

	params.logger?.debug(
		`Setting generation in storage: id=${params.generation.id}`,
	);
	const newIndex = toNodeGenerationIndex(params.generation);
	const nodeId = params.generation.context.operationNode.id;

	// Update nodeId-based index
	const currentNodeIndexes = await getNodeGenerationIndexes({
		deprecated_storage: params.deprecated_storage,
		storage: params.storage,
		useExperimentalStorage: params.useExperimentalStorage,
		nodeId,
	});
	const nextNodeIndexes = upsertIndex(currentNodeIndexes, newIndex);
	await writeNodeIndexes({
		deprecated_storage: params.deprecated_storage,
		storage: params.storage,
		useExperimentalStorage: params.useExperimentalStorage,
		nodeId,
		indexes: nextNodeIndexes,
	});

	// Update actId-based index when present
	const actId = params.generation.context.origin.actId;
	params.logger?.debug(`internalSetGeneration ---- ${actId}`);
	params.logger?.debug(JSON.stringify(newIndex, null, 2));
	if (actId !== undefined) {
		updateActGenerationIndexes(params.storage, actId, newIndex);
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

async function writeNodeIndexes(args: {
	deprecated_storage: Storage;
	storage: GiselleStorage;
	useExperimentalStorage?: boolean;
	nodeId: NodeId;
	indexes: NodeGenerationIndex[];
}) {
	if (args.useExperimentalStorage) {
		await args.storage.setJson({
			path: nodeGenerationIndexPath(args.nodeId),
			data: args.indexes,
			schema: NodeGenerationIndex.array(),
		});
		return;
	}
	await args.deprecated_storage.setItem(
		nodeGenerationIndexPath(args.nodeId),
		args.indexes,
	);
}
