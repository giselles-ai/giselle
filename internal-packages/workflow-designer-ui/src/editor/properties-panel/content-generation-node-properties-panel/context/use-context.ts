import type {
	ContentGenerationNode,
	NodeLike,
	OutputId,
} from "@giselles-ai/protocol";
import { useWorkflowDesignerStore } from "@giselles-ai/react";
import { useMemo } from "react";

interface ContextFragment {
	outputId: OutputId;
	node: NodeLike;
}

export function useContext(node: ContentGenerationNode) {
	const { nodes, connections } = useWorkflowDesignerStore((s) => ({
		connections: s.workspace.connections,
		nodes: s.workspace.nodes,
	}));

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
			const output = connectedNode.outputs.find(
				(output) => output.id === connectedConnection.outputId,
			);
			if (output === undefined) {
				continue;
			}
			fragments.push({
				outputId: output.id,
				node: connectedNode,
			});
		}
		return fragments;
	}, [connections, node.id, nodes]);
	return {
		fragments: contextFragments,
	};
}
