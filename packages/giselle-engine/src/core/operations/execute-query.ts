import { type QueuedGeneration, isQueryNode } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";

export async function executeQuery(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
}) {
	const operationNode = args.generation.context.operationNode;
	if (!isQueryNode(operationNode)) {
		throw new Error("Invalid generation type");
	}
	throw new Error("Not implemented");
}
