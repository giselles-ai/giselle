import type { Node } from "@giselle-sdk/data-type";
import {
	Capability,
	hasCapability,
	languageModels,
} from "@giselle-sdk/language-model";

export type ConnectionValidationResult =
	| { canConnect: true }
	| { canConnect: false; message: string };

export function isSupportedConnection(
	senderNode: Node,
	receiverNode: Node,
): ConnectionValidationResult {
	// prevent self-loop
	if (senderNode.id === receiverNode.id) {
		return {
			canConnect: false,
			message: "Connecting to the same node is not allowed",
		};
	}

	// only operation node can receive inputs
	if (receiverNode.type !== "operation") {
		return {
			canConnect: false,
			message: "This node does not receive inputs",
		};
	}

	// trigger and action node can be connected to any node
	if (
		senderNode.content.type === "trigger" ||
		senderNode.content.type === "action"
	) {
		return {
			canConnect: true,
		};
	}

	// image generation, github is not supported as an output
	if (senderNode.content.type === "imageGeneration") {
		return {
			canConnect: false,
			message: "Image generation node is not supported as an output",
		};
	}
	if (senderNode.content.type === "github") {
		return {
			canConnect: false,
			message: "GitHub node is not supported as an output",
		};
	}

	// file can be connected to generation node if the model have a capability to handle file input
	if (senderNode.content.type === "file") {
		if (
			receiverNode.content.type !== "textGeneration" &&
			receiverNode.content.type !== "imageGeneration"
		) {
			return {
				canConnect: false,
				message: "File node is not supported as an input for this node",
			};
		}

		const inputNodeLLMId = receiverNode.content.llm.id;
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
		if (senderNode.content.category === "text") {
			return {
				canConnect: true,
			};
		}

		if (
			senderNode.content.category === "image" &&
			hasCapability(inputNodeLanguageModel, Capability.ImageFileInput)
		) {
			return {
				canConnect: true,
			};
		}

		if (
			senderNode.content.category === "pdf" &&
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
	if (senderNode.content.type === "vectorStore") {
		if (receiverNode.content.type === "query") {
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
	if (senderNode.content.type === "query") {
		if (
			receiverNode.content.type !== "textGeneration" &&
			receiverNode.content.type !== "imageGeneration"
		) {
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
