import {
	isActionNode,
	isOperationNode,
	NodeId,
	type NodeLike,
} from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";

export function useDeleteNode() {
	const store = useAppDesignerStoreApi();

	return useCallback(
		(nodeIdToDelete: NodeId | string) => {
			const nodeId = NodeId.parse(nodeIdToDelete);
			store.setState((s) => {
				const connectionsToDelete = s.connections.filter(
					(c) => c.inputNode.id === nodeId || c.outputNode.id === nodeId,
				);
				const connectionIdsToDelete = new Set(
					connectionsToDelete.map((c) => c.id),
				);

				const ui = { ...s.ui, nodeState: { ...s.ui.nodeState } };
				delete ui.nodeState[nodeId];
				if (ui.selectedConnectionIds) {
					ui.selectedConnectionIds = ui.selectedConnectionIds.filter(
						(id) => !connectionIdsToDelete.has(id),
					);
				}

				const inputsToRemove = new Map(
					s.connections
						.filter((c) => c.outputNode.id === nodeId)
						.map((c) => [c.inputNode.id, c.inputId] as const),
				);

				const nodes: NodeLike[] = s.nodes
					.filter((n) => n.id !== nodeId)
					.map((n) => {
						const inputIdToRemove = inputsToRemove.get(n.id);
						if (!inputIdToRemove || !isOperationNode(n) || isActionNode(n)) {
							return n;
						}
						return {
							...n,
							inputs: n.inputs.filter((input) => input.id !== inputIdToRemove),
						} as NodeLike;
					});

				const connections = s.connections.filter(
					(c) => c.inputNode.id !== nodeId && c.outputNode.id !== nodeId,
				);

				return { ...s, nodes, connections, ui };
			});
		},
		[store],
	);
}
