import {
	isActionNode,
	isAppEntryNode,
	isOperationNode,
	NodeId,
	type NodeLike,
} from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useGiselle } from "../giselle-client-provider";
import { useSyncAppConnectionStateIfNeeded } from "./use-sync-app-connection-state-if-needed";

export function useDeleteNode() {
	const client = useGiselle();
	const store = useAppDesignerStoreApi();
	const syncAppConnectionStateIfNeeded = useSyncAppConnectionStateIfNeeded();

	return useCallback(
		(nodeIdToDelete: NodeId | string) => {
			const nodeId = NodeId.parse(nodeIdToDelete);

			const currentState = store.getState();
			const targetNode = currentState.nodes.find((n) => n.id === nodeId);
			const appIdToDelete =
				targetNode &&
				isAppEntryNode(targetNode) &&
				targetNode.content.status === "configured"
					? targetNode.content.appId
					: null;

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

			if (appIdToDelete) {
				void client
					.deleteApp({ appId: appIdToDelete })
					.catch((error) =>
						console.error(
							"Failed to delete App for deleted AppEntry node:",
							error,
						),
					);
			}

			syncAppConnectionStateIfNeeded();
		},
		[client, store, syncAppConnectionStateIfNeeded],
	);
}
