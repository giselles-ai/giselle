import type { Input, NodeId } from "@giselles-ai/protocol";
import { useMemo } from "react";
import { useAppDesignerStore } from "../../../../app-designer";
import type { InputWithConnectedOutput } from "./connected-outputs";

/**
 * Custom hook to get node inputs with their connection information
 * @param nodeId The ID of the node whose inputs to process
 * @param inputs The inputs to process
 * @returns Object containing inputs with their connection information and validation status
 */
export function useConnectedInputs(nodeId: NodeId, inputs: Input[]) {
	const { nodes, connections } = useAppDesignerStore((s) => ({
		nodes: s.nodes,
		connections: s.connections,
	}));

	const connectedInputs = useMemo(() => {
		const result: InputWithConnectedOutput[] = [];
		const connectionsToThisNode = connections.filter(
			(connection) => connection.inputNode.id === nodeId,
		);

		for (const input of inputs) {
			// Exclude inputs where id and accessor are the same, as these are candidate inputs
			if (input.id === input.accessor) {
				continue;
			}
			const connectedConnection = connectionsToThisNode.find(
				(connection) => connection.inputId === input.id,
			);
			const connectedNode = nodes.find(
				(node) => node.id === connectedConnection?.outputNode.id,
			);
			const connectedOutput = connectedNode?.outputs.find(
				(output) => output.id === connectedConnection?.outputId,
			);

			if (
				connectedConnection === undefined ||
				connectedNode === undefined ||
				connectedOutput === undefined
			) {
				// No connection found
				result.push(input);
				continue;
			}

			// Connection found
			result.push({
				...input,
				connectedOutput: {
					...connectedOutput,
					connectionId: connectedConnection.id,
					node: connectedNode,
				},
			});
		}
		return result;
	}, [connections, inputs, nodeId, nodes]);

	const missingRequiredConnections = useMemo(() => {
		return connectedInputs.filter(
			(input) => input.isRequired && input.connectedOutput === undefined,
		);
	}, [connectedInputs]);

	const isValid = useMemo(
		() => missingRequiredConnections.length === 0,
		[missingRequiredConnections],
	);

	return {
		connectedInputs,
		missingRequiredConnections,
		isValid,
	};
}
