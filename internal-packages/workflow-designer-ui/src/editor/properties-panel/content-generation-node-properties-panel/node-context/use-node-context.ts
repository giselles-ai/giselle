import type { ContentGenerationNode, NodeId } from "@giselles-ai/protocol";
import {
	type UIConnection,
	useWorkflowDesignerStore,
} from "@giselles-ai/react";
import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";

export function useNodeContext(node: ContentGenerationNode) {
	const { nodes, connections: allConnections } = useWorkflowDesignerStore(
		useShallow((s) => ({
			connections: s.workspace.connections,
			nodes: s.workspace.nodes,
		})),
	);

	const connections = useMemo(() => {
		const connectedConnections = allConnections.filter(
			(connection) => connection.inputNode.id === node.id,
		);

		const uiConnections: UIConnection[] = [];
		for (const connection of connectedConnections) {
			const outputNode = nodes.find((n) => n.id === connection.outputNode.id);
			if (outputNode === undefined) {
				continue;
			}
			const output = outputNode.outputs.find(
				(output) => output.id === connection.outputId,
			);
			if (output === undefined) {
				continue;
			}
			const inputNode = nodes.find((n) => n.id === connection.inputNode.id);
			if (inputNode === undefined) {
				continue;
			}
			const input = inputNode.inputs.find(
				(input) => input.id === connection.inputId,
			);
			if (input === undefined) {
				continue;
			}
			uiConnections.push({
				id: connection.id,
				output,
				outputNode,
				input,
				inputNode,
			});
		}
		return uiConnections;
	}, [allConnections, node.id, nodes]);

	const shouldShowOutputLabel = useCallback(
		(nodeId: NodeId) => {
			const countMap = new Map<string, number>();
			for (const connection of connections) {
				const currentCount = countMap.get(connection.outputNode.id) ?? 0;
				countMap.set(connection.outputNode.id, currentCount + 1);
			}
			return (countMap.get(nodeId) ?? 0) > 1;
		},
		[connections],
	);

	return {
		shouldShowOutputLabel,
		connections,
	};
}
