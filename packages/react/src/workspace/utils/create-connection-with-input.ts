import {
	type Input,
	InputId,
	isActionNode,
	type NodeLike,
	type OutputId,
} from "@giselles-ai/protocol";

export interface CreateConnectionWithInputParams {
	outputNode: NodeLike;
	outputId: OutputId;
	inputNode: NodeLike;
	inputId?: InputId;
	updateNodeData: <T extends NodeLike>(node: T, data: Partial<T>) => void;
	addConnection: (args: {
		outputNode: NodeLike;
		outputId: OutputId;
		inputNode: NodeLike;
		inputId: InputId;
	}) => void;
}

/**
 * Creates a connection between two nodes, automatically creating an input
 * if the input node is not an ActionNode.
 *
 * For ActionNodes, the inputId must be provided as they have predefined inputs.
 * For other operation nodes (like ContentGenerationNode), a new input will be
 * automatically created and added to the node.
 */
export function createConnectionWithInput({
	outputNode,
	outputId,
	inputNode,
	inputId,
	updateNodeData,
	addConnection,
}: CreateConnectionWithInputParams): void {
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
	} else {
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
	}
}
