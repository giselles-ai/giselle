import {
	isActionNode,
	isOperationNode,
	NodeId,
	type NodeId as NodeIdType,
} from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useSyncAppConnectionStateIfNeeded } from "./use-sync-app-connection-state-if-needed";

/**
 * Disconnects nodes by removing all connections from the output node to the input node.
 *
 * This is the inverse of `useConnectNodes` (which can create multiple connections).
 */
export function useDisconnectNodes() {
	const store = useAppDesignerStoreApi();
	const syncAppConnectionStateIfNeeded = useSyncAppConnectionStateIfNeeded();

	return useCallback(
		(outputNodeId: NodeIdType, inputNodeId: NodeIdType) => {
			store.setState((s) => {
				const targetConnections = s.connections.filter(
					(c) =>
						c.outputNode.id === outputNodeId && c.inputNode.id === inputNodeId,
				);
				if (targetConnections.length === 0) {
					return s;
				}

				const connectionIdsToDelete = new Set(
					targetConnections.map((c) => c.id),
				);
				const nextConnections = s.connections.filter(
					(c) => !connectionIdsToDelete.has(c.id),
				);

				const ui = { ...s.ui };
				if (ui.selectedConnectionIds) {
					ui.selectedConnectionIds = ui.selectedConnectionIds.filter(
						(id) => !connectionIdsToDelete.has(id),
					);
				}

				const targetNode = s.nodes.find((n) => n.id === inputNodeId);
				if (
					targetNode === undefined ||
					!isOperationNode(targetNode) ||
					isActionNode(targetNode)
				) {
					return { ...s, connections: nextConnections, ui };
				}

				const inputIdsToRemove = new Set(
					targetConnections.map((c) => c.inputId),
				);
				const updatedInputs = targetNode.inputs.filter(
					(input) => !inputIdsToRemove.has(input.id),
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
