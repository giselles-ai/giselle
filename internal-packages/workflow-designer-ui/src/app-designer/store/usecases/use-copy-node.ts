import { nodeFactories } from "@giselles-ai/node-registry";
import type { Node, NodeLike, NodeUIState } from "@giselles-ai/protocol";
import { isSupportedConnection } from "@giselles-ai/react";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useAddConnection } from "./use-add-connection";
import { useAddNode } from "./use-add-node";

export type ConnectionCloneStrategy = "inputs-only" | "all" | "none";
const DEFAULT_CONNECTION_CLONE_STRATEGY: ConnectionCloneStrategy =
	"inputs-only";

export function useCopyNode() {
	const store = useAppDesignerStoreApi();
	const addNode = useAddNode();
	const addConnection = useAddConnection();

	return useCallback(
		(
			sourceNode: Node,
			options?: {
				ui?: NodeUIState;
				connectionCloneStrategy?: ConnectionCloneStrategy;
			},
		): Node | undefined => {
			const state = store.getState();
			const { newNode, inputIdMap, outputIdMap } =
				nodeFactories.clone(sourceNode);

			addNode(newNode, options?.ui);

			const strategy =
				options?.connectionCloneStrategy ?? DEFAULT_CONNECTION_CLONE_STRATEGY;

			for (const originalConnection of state.connections) {
				if (
					originalConnection.inputNode.id === sourceNode.id &&
					(strategy === "all" || strategy === "inputs-only")
				) {
					const outputNode = state.nodes.find(
						(n) => n.id === originalConnection.outputNode.id,
					);
					const newInputId = inputIdMap[originalConnection.inputId];
					if (outputNode && newInputId) {
						const connectionExists = state.connections.some(
							(c) =>
								c.outputNode.id === outputNode.id &&
								c.outputId === originalConnection.outputId &&
								c.inputNode.id === newNode.id &&
								c.inputId === newInputId,
						);
						const connectionValid = isSupportedConnection(
							outputNode,
							newNode as NodeLike,
						).canConnect;
						if (!connectionExists && connectionValid) {
							addConnection({
								outputNode,
								outputId: originalConnection.outputId,
								inputNode: newNode,
								inputId: newInputId,
							});
						}
					}
				} else if (
					originalConnection.outputNode.id === sourceNode.id &&
					strategy === "all"
				) {
					const inputNode = state.nodes.find(
						(n) => n.id === originalConnection.inputNode.id,
					);
					const newOutputId = outputIdMap[originalConnection.outputId];
					if (inputNode && newOutputId) {
						const connectionExists = state.connections.some(
							(c) =>
								c.outputNode.id === newNode.id &&
								c.outputId === newOutputId &&
								c.inputNode.id === inputNode.id &&
								c.inputId === originalConnection.inputId,
						);
						const connectionValid = isSupportedConnection(
							newNode as NodeLike,
							inputNode,
						).canConnect;
						if (!connectionExists && connectionValid) {
							addConnection({
								outputNode: newNode,
								outputId: newOutputId,
								inputNode,
								inputId: originalConnection.inputId,
							});
						}
					}
				}
			}

			return newNode;
		},
		[addConnection, addNode, store],
	);
}
