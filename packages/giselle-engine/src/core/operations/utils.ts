import {
	type GenerationContext,
	type OutputId as InputId,
	type NodeId,
	type Output,
	isCompletedGeneration,
} from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import { getGeneration, getNodeGenerationIndexes } from "../generations/utils";

export async function connectionResolver(args: {
	nodeId: NodeId;
	input: string;
	context: GenerationContext;
	storage: Storage;
}) {
	const nodeGenerationIndexes = await getNodeGenerationIndexes({
		storage: args.storage,
		nodeId: args.nodeId,
	});
	if (
		nodeGenerationIndexes === undefined ||
		nodeGenerationIndexes.length === 0
	) {
		return undefined;
	}
	const generation = await getGeneration({
		...args,
		storage: args.storage,
		generationId: nodeGenerationIndexes[nodeGenerationIndexes.length - 1].id,
	});
	if (generation === undefined || !isCompletedGeneration(generation)) {
		return undefined;
	}
	let output: Output | undefined;
	for (const sourceNode of args.context.sourceNodes) {
		for (const sourceOutput of sourceNode.outputs) {
			// if (sourceOutput.accessor === args.inputAccessor) {
			// 	output = sourceOutput;
			// 	break;
			// }
		}
	}
	if (output === undefined) {
		return undefined;
	}
	// const generationOutput = generation.outputs.find(
	// 	(output) => output.outputId === args.inputId,
	// );
	// if (generationOutput === undefined) {
	// 	return undefined;
	// }
	// switch (generationOutput.type) {
	// 	case "source":
	// 		return JSON.stringify(generationOutput.sources);
	// 	case "reasoning":
	// 		throw new Error("Generation output type is not supported");
	// 	case "generated-image":
	// 		throw new Error("Generation output type is not supported");
	// 	case "generated-text":
	// 		return generationOutput.content;
	// 	default: {
	// 		const _exhaustiveCheck: never = generationOutput;
	// 		throw new Error(`Unhandled generation output type: ${_exhaustiveCheck}`);
	// 	}
	// }
}
