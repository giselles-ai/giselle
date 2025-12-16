import {
	InputId,
	isActionNode,
	type NodeId,
	OutputId,
} from "@giselles-ai/protocol";
import {
	createConnectionWithInput,
	isSupportedConnection,
} from "@giselles-ai/react";
import type { Connection } from "@xyflow/react";
import { useCallback } from "react";
import { useAppDesignerStore, useWorkspaceActions } from "../hooks";

export function useConnectNodes() {
	const nodes = useAppDesignerStore((s) => s.nodes);
	const { addConnection, updateNodeData } = useWorkspaceActions((s) => ({
		addConnection: s.addConnection,
		updateNodeData: s.updateNodeData,
	}));

	return useCallback(
		(connection: Connection) => {
			const outputNode = nodes.find(
				(n) => n.id === (connection.source as NodeId),
			);
			const inputNode = nodes.find(
				(n) => n.id === (connection.target as NodeId),
			);
			if (!outputNode || !inputNode) {
				throw new Error("Node not found");
			}

			const supported = isSupportedConnection(outputNode, inputNode);
			if (!supported.canConnect) {
				throw new Error(supported.message);
			}

			const safeOutputId = OutputId.safeParse(connection.sourceHandle);
			if (!safeOutputId.success) {
				throw new Error("Invalid output id");
			}
			const outputId = safeOutputId.data;

			const inputId = isActionNode(inputNode)
				? InputId.safeParse(connection.targetHandle).success
					? InputId.safeParse(connection.targetHandle).data
					: undefined
				: undefined;

			if (isActionNode(inputNode) && inputId === undefined) {
				throw new Error("Invalid input id");
			}

			createConnectionWithInput({
				outputNode,
				outputId,
				inputNode,
				inputId,
				updateNodeData,
				addConnection: ({ outputNode, outputId, inputNode, inputId }) =>
					addConnection({ outputNode, outputId, inputNode, inputId }),
			});
		},
		[addConnection, nodes, updateNodeData],
	);
}
