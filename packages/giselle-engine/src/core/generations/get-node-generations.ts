import type { GenerationOrigin, NodeId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { getGeneration, getNodeGenerationIndexes } from "./utils";

const limit = 10;

export async function getNodeGenerations(args: {
	context: GiselleEngineContext;
	origin: GenerationOrigin;
	nodeId: NodeId;
}) {
	const nodeGenerationIndexes = await getNodeGenerationIndexes({
		storage: args.context.storage,
		origin: args.origin,
		nodeId: args.nodeId,
	});
	if (nodeGenerationIndexes === undefined) {
		return [];
	}
	return await Promise.all(
		nodeGenerationIndexes
			.sort((a, b) => b.createdAt - a.createdAt)
			.slice(0, limit)
			.reverse()
			.map((nodeGenerationIndex) =>
				getGeneration({
					generationId: nodeGenerationIndex.id,
					storage: args.context.storage,
				}),
			),
	).then((result) => result.filter((generation) => generation !== undefined));
}
