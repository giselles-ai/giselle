import { nodeClassHasCategory } from "../nodes";
import { nodeClassCategory } from "../nodes/types";
import type { PlaygroundGraph } from "../playground/types";

export const getTriggerNode = (graph: PlaygroundGraph) => {
	return graph.nodes.find(({ className }) =>
		nodeClassHasCategory(className, nodeClassCategory.trigger),
	);
};

export const getResponseNode = (graph: PlaygroundGraph) => {
	return graph.nodes.find(({ className }) =>
		nodeClassHasCategory(className, nodeClassCategory.response),
	);
};
