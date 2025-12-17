import {
	type Input,
	InputId,
	type InputId as InputIdType,
	isActionNode,
	type NodeLike,
	type OutputId,
} from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAddConnection } from "./use-add-connection";
import { useUpdateNodeData } from "./use-update-node-data";

export interface AddConnectionAndAddInputParams {
	outputNode: NodeLike;
	outputId: OutputId;
	inputNode: NodeLike;
	/**
	 * Required when the input node is an ActionNode (it has predefined inputs).
	 */
	inputId?: InputIdType;
}

/**
 * Adds a connection between two nodes.
 *
 * If the input node is not an ActionNode, this usecase appends a new input to
 * the input node before creating the connection.
 */
export function useAddConnectionAndAddInput() {
	const updateNodeData = useUpdateNodeData();
	const addConnection = useAddConnection();

	return useCallback(
		({
			outputNode,
			outputId,
			inputNode,
			inputId,
		}: AddConnectionAndAddInputParams) => {
			if (isActionNode(inputNode)) {
				if (inputId === undefined) {
					throw new Error("InputId is required for ActionNode");
				}
				addConnection({
					outputNode,
					outputId,
					inputNode,
					inputId,
				});
				return;
			}

			const newInputId = InputId.generate();
			const newInput: Input = {
				id: newInputId,
				label: "Input",
				accessor: newInputId,
			};
			updateNodeData(inputNode, {
				inputs: [...inputNode.inputs, newInput],
			});
			addConnection({
				outputNode,
				outputId,
				inputNode,
				inputId: newInput.id,
			});
		},
		[addConnection, updateNodeData],
	);
}
