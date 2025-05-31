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
					options: {
						bypassingCache: true,
						skipMod: true,
					},
				}).catch(() => null),
			),
	).then((result) => result.filter((generation) => !!generation));
}
