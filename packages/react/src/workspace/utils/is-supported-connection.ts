import {
	Capability,
	hasCapability,
	languageModels,
} from "@giselles-ai/language-model";
import {
	isFileNode,
	isImageGenerationNode,
	isQueryNode,
	isTextGenerationNode,
	isVectorStoreNode,
	type NodeLike,
} from "@giselles-ai/protocol";

export type ConnectionValidationResult =
	| { canConnect: true }
	| { canConnect: false; message: string };

export function isSupportedConnection(
	outputNode: NodeLike,
	inputNode: NodeLike,
	experimental_contentGenerationNode = false,
): ConnectionValidationResult {
	if (experimental_contentGenerationNode) {
		return isSupportedConnectionV2(outputNode, inputNode);
	}
	if (outputNode.id === inputNode.id) {
		// prevent self-loop
		return {
			canConnect: false,
			message: "Connecting to the same node is not allowed",
		};
	}
	// prevent self-loop
	if (outputNode.id === inputNode.id) {
		return {
			canConnect: false,
			message: "Connecting to the same node is not allowed",
		};
	}

	// only operation node can receive inputs
	if (inputNode.type !== "operation") {
		return {
			canConnect: false,
			message: "This node does not receive inputs",
		};
	}

	// prevent unsupported inputs for image generation node
	if (isImageGenerationNode(inputNode)) {
		if (outputNode.content.type === "github") {
			return {
				canConnect: false,
				message: "GitHub node is not supported as an input for this node",
			};
		}
	}

	// trigger and action node can be connected to any node (except ImageGenerationNode, handled above)
	if (
		outputNode.content.type === "trigger" ||
		outputNode.content.type === "action"
	) {
		return {
			canConnect: true,
		};
	}

	// image generation can be connected to generation node if the model have a capability to handle generated image input
	if (isImageGenerationNode(outputNode)) {
		if (!isTextGenerationNode(inputNode) && !isImageGenerationNode(inputNode)) {
			return {
				canConnect: false,
				message:
					"Image generation node can only be connected to text generation or image generation",
			};
		}

		const inputNodeLLMId = inputNode.content.llm.id;
		const inputNodeLanguageModel = languageModels.find(
			(languageModel) => languageModel.id === inputNodeLLMId,
		);

		if (inputNodeLanguageModel === undefined) {
			return {
				canConnect: false,
				message: "This node is not supported as an input for Image generation",
			};
		}
		if (
			hasCapability(inputNodeLanguageModel, Capability.ImageGenerationInput)
		) {
			return {
				canConnect: true,
			};
		}

		return {
			canConnect: false,
			message:
				"Image generation node is not supported as an input for this node",
		};
	}
	if (outputNode.content.type === "github") {
		return {
			canConnect: false,
			message: "GitHub node is not supported as an output",
		};
	}

	// file can be connected to generation node if the model have a capability to handle file input
	if (isFileNode(outputNode)) {
		if (!isTextGenerationNode(inputNode) && !isImageGenerationNode(inputNode)) {
			return {
				canConnect: false,
				message: "File node is not supported as an input for this node",
			};
		}

		const inputNodeLLMId = inputNode.content.llm.id;
		const inputNodeLanguageModel = languageModels.find(
			(languageModel) => languageModel.id === inputNodeLLMId,
		);

		if (inputNodeLanguageModel === undefined) {
			return {
				canConnect: false,
				message: "This node is not supported as an input for File",
			};
		}
		if (hasCapability(inputNodeLanguageModel, Capability.GenericFileInput)) {
			return {
				canConnect: true,
			};
		}
		if (outputNode.content.category === "text") {
			return {
				canConnect: true,
			};
		}

		if (
			outputNode.content.category === "image" &&
			hasCapability(inputNodeLanguageModel, Capability.ImageFileInput)
		) {
			return {
				canConnect: true,
			};
		}

		if (
			outputNode.content.category === "pdf" &&
			hasCapability(inputNodeLanguageModel, Capability.PdfFileInput)
		) {
			return {
				canConnect: true,
			};
		}

		return {
			canConnect: false,
			message: "File node is not supported as an input for this node",
		};
	}

	// Vector store node can only be connected to query node
	if (isVectorStoreNode(outputNode)) {
		if (isQueryNode(inputNode)) {
			return {
				canConnect: true,
			};
		}
		return {
			canConnect: false,
			message: "Vector store node can only be connected to query node",
		};
	}

	// query can only be connected to text generation or image generation
	if (isQueryNode(outputNode)) {
		if (!isTextGenerationNode(inputNode) && !isImageGenerationNode(inputNode)) {
			return {
				canConnect: false,
				message:
					"Query node can only be connected to text generation or image generation",
			};
		}
	}

	return {
		canConnect: true,
	};
}

function isSupportedConnectionV2(
	outputNode: NodeLike,
	inputNode: NodeLike,
): ConnectionValidationResult {
	if (outputNode.id === inputNode.id) {
		// prevent self-loop
		return {
			canConnect: false,
			message: "Connecting to the same node is not allowed",
		};
	}

	switch (inputNode.type) {
		case "variable":
			return {
				canConnect: false,
				message: "This node does not receive inputs",
			};
		case "operation":
			switch (inputNode.content.type) {
				case "action":
					if (
						outputNode.content.type === "contentGeneration" ||
						outputNode.content.type === "text" ||
						outputNode.content.type === "textGeneration" ||
						outputNode.content.type === "trigger" ||
						outputNode.content.type === "appEntry"
					) {
						return {
							canConnect: true,
						};
					}
					return {
						canConnect: false,
						message: `Action Node does not receive ${outputNode.content.type}`,
					};
				case "appEntry":
					// App Entry Node doesn't have inputs in the UI,
					// so this shouldn't happen (defensive programming)
					return {
						canConnect: false,
						message: `App Entry Node does not receive ${outputNode.content.type}`,
					};
				case "contentGeneration":
				case "imageGeneration":
				case "textGeneration":
					if (outputNode.content.type === "vectorStore") {
						return {
							canConnect: false,
							message: `${outputNode.content.type} Node does not receive Query Node`,
						};
					}
					return {
						canConnect: true,
					};
				case "query":
					if (
						outputNode.content.type === "contentGeneration" ||
						outputNode.content.type === "textGeneration"
					) {
						return {
							canConnect: true,
						};
					}
					return {
						canConnect: false,
						message: `Query Node does not receive ${outputNode.content.type}`,
					};
				case "trigger":
					// Trigger Node doesn't have inputs in the UI,
					// so this shouldn't happen (defensive programming)
					return {
						canConnect: false,
						message: `App Entry Node does not receive ${outputNode.content.type}`,
					};
				default: {
					const _exhaustiveCheck: never = inputNode.content.type;
					throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
				}
			}
	}
}
