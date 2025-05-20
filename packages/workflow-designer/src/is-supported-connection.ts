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
	outputNode: Node,
	inputNode: Node,
): ConnectionValidationResult {
	if (outputNode.id === inputNode.id) {
		return {
			canConnect: false,
			message: "Connecting to the same node is not allowed",
		};
	}
	if (inputNode.type !== "operation") {
		return {
			canConnect: false,
			message: "This node does not receive inputs",
		};
	}
	if (
		inputNode.content.type === "trigger" ||
		inputNode.content.type === "action"
	) {
		return {
			canConnect: true,
		};
	}
	if (outputNode.content.type === "vectorStore") {
		// TODO: support vector store to connect to query node
		return {
			canConnect: false,
			message: "Vector store node is not supported as an output",
		};
	}

	if (outputNode.content.type === "imageGeneration") {
		return {
			canConnect: false,
			message: "Image generation node is not supported as an output",
		};
	}
	if (outputNode.content.type === "github") {
		return {
			canConnect: false,
			message: "GitHub node is not supported as an output",
		};
	}

	if (outputNode.content.type === "file") {
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

	return {
		canConnect: true,
	};
}
