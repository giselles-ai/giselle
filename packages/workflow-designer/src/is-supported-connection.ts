import type { Node } from "@giselle-sdk/data-type";

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
	if (inputNode.type !== "action") {
		return {
			canConnect: false,
			message: "This node does not receive inputs",
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
		if (inputNode.content.type === "imageGeneration") {
			return {
				canConnect: false,
				message: "File node is not supported as an input for Image Generation",
			};
		}

		if (inputNode.content.llm.provider === "openai") {
			return {
				canConnect: false,
				message: "File node is not supported as an input for OpenAI",
			};
		}
		if (inputNode.content.llm.provider === "perplexity") {
			return {
				canConnect: false,
				message: "File node is not supported as an input for Perplexity",
			};
		}
	}

	return {
		canConnect: true,
	};
}
