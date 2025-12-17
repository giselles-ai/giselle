import { isActionNode, isOperationNode, NodeId } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useSyncAppConnectionStateIfNeeded } from "./use-sync-app-connection-state-if-needed";

export function useDeleteConnection() {
	const store = useAppDesignerStoreApi();
	const syncAppConnectionStateIfNeeded = useSyncAppConnectionStateIfNeeded();

	return useCallback(
		(connectionId: string) => {
			store.setState((s) => {
				const targetConnection = s.connections.find(
					(c) => c.id === connectionId,
				);
				if (!targetConnection) {
					return s;
				}

				const nextConnections = s.connections.filter(
					(c) => c.id !== connectionId,
				);
				const ui = { ...s.ui };
				if (ui.selectedConnectionIds) {
					ui.selectedConnectionIds = ui.selectedConnectionIds.filter(
						(id) => id !== connectionId,
					);
				}

				const targetNode = s.nodes.find(
					(n) => n.id === targetConnection.inputNode.id,
				);
				if (
					targetNode === undefined ||
					!isOperationNode(targetNode) ||
					isActionNode(targetNode)
				) {
					return { ...s, connections: nextConnections, ui };
				}

				const updatedInputs = targetNode.inputs.filter(
					(input) => input.id !== targetConnection.inputId,
				);
				const nextNodes = s.nodes.map((n) =>
					n.id === NodeId.parse(targetNode.id)
						? { ...n, inputs: updatedInputs }
						: n,
				);

				return { ...s, connections: nextConnections, nodes: nextNodes, ui };
			});
			syncAppConnectionStateIfNeeded();
		},
		[store, syncAppConnectionStateIfNeeded],
	);
}
