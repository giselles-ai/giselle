import { type Input, InputId, type NodeId } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStore, useWorkspaceActions } from "../hooks";
import { useAddConnection } from "./use-add-connection";

export function useConnectNode() {
	const nodes = useAppDesignerStore((s) => s.nodes);
	const addConnection = useAddConnection();
	const addNodeInput = useWorkspaceActions((s) => s.addNodeInput);
	return useCallback(
		(outputNodeId: NodeId, inputNodeId: NodeId) => {
			const outputNode = nodes.find((node) => node.id === outputNodeId);
			const inputNode = nodes.find((node) => node.id === inputNodeId);
			if (outputNode === undefined || inputNode === undefined) {
				console.warn(`Node not found: ${outputNodeId} or ${inputNodeId}`);
				return;
			}
			for (const output of outputNode.outputs) {
				const newInputId = InputId.generate();
				const newInput: Input = {
					id: newInputId,
					label: "Input",
					accessor: newInputId,
				};
				addNodeInput(inputNode.id, newInput);
				addConnection({
					outputNode,
					outputId: output.id,
					inputNode,
					inputId: newInput.id,
				});
			}
		},
		[nodes, addNodeInput, addConnection],
	);
}
