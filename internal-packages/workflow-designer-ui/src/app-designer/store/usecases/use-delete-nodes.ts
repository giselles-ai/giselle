import {
	type Connection,
	isActionNode,
	isAppEntryNode,
	isEndNode,
	isOperationNode,
	NodeId,
	type NodeLike,
	type NodeUIState,
} from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useGiselle } from "../giselle-client-provider";
import { useSyncAppConnectionStateIfNeeded } from "./use-sync-app-connection-state-if-needed";

function buildDeleteSet(args: {
	nodeIdsToDelete: Set<string>;
	nodes: NodeLike[];
}) {
	const { nodeIdsToDelete, nodes } = args;
	const appEntryNode = nodes.find((n) => isAppEntryNode(n));
	const endNode = nodes.find((n) => isEndNode(n));

	const includesAppEntry =
		(appEntryNode && nodeIdsToDelete.has(appEntryNode.id)) ?? false;
	const includesEnd = (endNode && nodeIdsToDelete.has(endNode.id)) ?? false;

	const shouldPairDelete = includesAppEntry || includesEnd;
	if (shouldPairDelete) {
		if (appEntryNode) nodeIdsToDelete.add(appEntryNode.id);
		if (endNode) nodeIdsToDelete.add(endNode.id);
	}

	return { shouldPairDelete, nodeIdsToDelete };
}

function computeNextStateForDelete(args: {
	nodeIdsToDelete: Set<string>;
	nodes: NodeLike[];
	connections: Connection[];
	ui: {
		nodeState: Record<string, NodeUIState | undefined>;
		selectedConnectionIds?: string[];
	};
}) {
	const { nodeIdsToDelete, nodes, connections } = args;

	const connectionsToDelete = connections.filter(
		(c) =>
			nodeIdsToDelete.has(c.inputNode.id) ||
			nodeIdsToDelete.has(c.outputNode.id),
	);
	const connectionIdsToDelete = new Set(connectionsToDelete.map((c) => c.id));

	const ui = {
		...args.ui,
		nodeState: { ...args.ui.nodeState },
	};
	for (const nodeId of nodeIdsToDelete) {
		delete ui.nodeState[NodeId.parse(nodeId)];
	}
	if (ui.selectedConnectionIds) {
		ui.selectedConnectionIds = ui.selectedConnectionIds.filter(
			(id) => !connectionIdsToDelete.has(id),
		);
	}

	const inputIdsToRemoveByNodeId = new Map<string, Set<string>>();
	for (const c of connections.filter((c) =>
		nodeIdsToDelete.has(c.outputNode.id),
	)) {
		const inputIdsToRemove =
			inputIdsToRemoveByNodeId.get(c.inputNode.id) ?? new Set<string>();
		inputIdsToRemove.add(c.inputId);
		inputIdsToRemoveByNodeId.set(c.inputNode.id, inputIdsToRemove);
	}

	const nextNodes: NodeLike[] = nodes
		.filter((n) => !nodeIdsToDelete.has(n.id))
		.map((n) => {
			const inputIdsToRemove = inputIdsToRemoveByNodeId.get(n.id);
			if (
				inputIdsToRemove === undefined ||
				!isOperationNode(n) ||
				isActionNode(n)
			) {
				return n;
			}
			return {
				...n,
				inputs: n.inputs.filter((input) => !inputIdsToRemove.has(input.id)),
			} as NodeLike;
		});

	const nextConnections = connections.filter(
		(c) =>
			!nodeIdsToDelete.has(c.inputNode.id) &&
			!nodeIdsToDelete.has(c.outputNode.id),
	);

	return { nodes: nextNodes, connections: nextConnections, ui };
}

export function useDeleteNodes() {
	const client = useGiselle();
	const store = useAppDesignerStoreApi();
	const syncAppConnectionStateIfNeeded = useSyncAppConnectionStateIfNeeded();

	return useCallback(
		async (nodeIdsToDelete: Array<NodeId | string>) => {
			const currentState = store.getState();
			const deleteSet = new Set(nodeIdsToDelete.map((id) => NodeId.parse(id)));

			const { shouldPairDelete, nodeIdsToDelete: expandedDeleteSet } =
				buildDeleteSet({
					nodeIdsToDelete: deleteSet,
					nodes: currentState.nodes,
				});

			if (shouldPairDelete) {
				const ok = window.confirm(
					"App Entry と End はセットです。どちらかを削除すると両方削除されます。削除しますか？",
				);
				if (!ok) {
					return;
				}
			}

			// If AppEntry is configured and is being deleted, delete its backing App.
			const appIdsToDelete = new Set<string>();
			for (const nodeId of expandedDeleteSet) {
				const targetNode = currentState.nodes.find((n) => n.id === nodeId);
				if (
					targetNode &&
					isAppEntryNode(targetNode) &&
					targetNode.content.status === "configured"
				) {
					appIdsToDelete.add(targetNode.content.appId);
				}
			}

			store.setState((s) => {
				const next = computeNextStateForDelete({
					nodeIdsToDelete: expandedDeleteSet,
					nodes: s.nodes,
					connections: s.connections,
					ui: s.ui,
				});
				return { ...s, ...next };
			});

			await Promise.all(
				[...appIdsToDelete].map((appId) =>
					client
						.deleteApp({ appId })
						.catch((error) =>
							console.error(
								"Failed to delete App for deleted AppEntry node:",
								error,
							),
						),
				),
			);

			syncAppConnectionStateIfNeeded();
		},
		[client, store, syncAppConnectionStateIfNeeded],
	);
}
