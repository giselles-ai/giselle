import type { Input, NodeId } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useMemo } from "react";
import type { InputWithConnectedOutput } from "./connected-outputs";

/**
 * Custom hook to get node inputs with their connection information
 * @param nodeId The ID of the node whose inputs to process
 * @param inputs The inputs to process
 * @returns Object containing inputs with their connection information and validation status
 */
export function useConnectedInputs(nodeId: NodeId, inputs: Input[]) {
	const { data: workspace } = useWorkflowDesigner();

	const connectedInputs = useMemo(() => {
		const result: InputWithConnectedOutput[] = [];
		const connectionsToThisNode = workspace.connections.filter(
			(connection) => connection.inputNode.id === nodeId,
		);

		for (const input of inputs) {
			const connectedConnection = connectionsToThisNode.find(
				(connection) => connection.inputId === input.id,
			);
			const connectedNode = workspace.nodes.find(
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
	}, [inputs, nodeId, workspace]);

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
