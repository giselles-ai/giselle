import type {
	ContentGenerationNode,
	NodeLike,
	Output,
} from "@giselles-ai/protocol";
import { useWorkflowDesignerStore } from "@giselles-ai/react";
import { useMemo } from "react";
import { useShallow } from "zustand/shallow";

interface ContextFragment {
	output: Output;
	node: NodeLike;
}

export function useNodeContext(node: ContentGenerationNode) {
	const { nodes, connections } = useWorkflowDesignerStore(
		useShallow((s) => ({
			connections: s.workspace.connections,
			nodes: s.workspace.nodes,
		})),
	);

	const contextFragments = useMemo(() => {
		const connectedConnections = connections.filter(
			(connection) => connection.inputNode.id === node.id,
		);

		const fragments: ContextFragment[] = [];
		for (const connectedConnection of connectedConnections) {
			const connectedNode = nodes.find(
				(n) => n.id === connectedConnection.outputNode.id,
			);
			if (connectedNode === undefined) {
				continue;
			}
			const connectedNodeOutput = connectedNode.outputs.find(
				(output) => output.id === connectedConnection.outputId,
			);
			if (connectedNodeOutput === undefined) {
				continue;
			}
			fragments.push({
				output: connectedNodeOutput,
				node: connectedNode,
			});
		}
		return fragments;
	}, [connections, node.id, nodes]);

	const shouldShowOutputLabel = useMemo(() => {
		const countMap = new Map<string, number>();
		for (const fragment of contextFragments) {
			const currentCount = countMap.get(fragment.node.id) ?? 0;
			countMap.set(fragment.node.id, currentCount + 1);
		}
		return (nodeId: string) => (countMap.get(nodeId) ?? 0) > 1;
	}, [contextFragments]);

	return {
		fragments: contextFragments,
		shouldShowOutputLabel,
	};
}
