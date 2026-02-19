import {
	anthropicLanguageModels,
	falLanguageModels,
	googleImageLanguageModels,
	openaiLanguageModels,
	perplexityLanguageModels,
} from "@giselles-ai/language-model";
import type {
	ActionNode,
	AppEntryNode,
	ContentGenerationNode,
	DataQueryNode,
	DataStoreNode,
	EndNode,
	FileNode,
	GitHubNode,
	ImageGenerationLanguageModelData,
	ImageGenerationNode,
	QueryNode,
	TextGenerationLanguageModelData,
	TextGenerationNode,
	TriggerNode,
	VariableNode,
	VectorStoreNode,
	WebPageNode,
} from "@giselles-ai/protocol";
import { NodeId } from "@giselles-ai/protocol";
import { describe, expect, test } from "vitest";

import { isSupportedConnection } from "./is-supported-connection";

describe("isSupportedConnection", () => {
	const createTextGenerationNode = (
		id: NodeId,
		llm: TextGenerationLanguageModelData = anthropicLanguageModels[0],
	) =>
		({
			id,
			type: "operation",
			inputs: [],
			outputs: [],
			content: {
				type: "textGeneration",
				llm,
				outputConfiguration: { outputFormat: "text" },
			},
		}) satisfies TextGenerationNode;
	const createImageGenerationNode = (
		id: NodeId,
		llm: ImageGenerationLanguageModelData = falLanguageModels[0],
	) =>
		({
			id,
			type: "operation",
			inputs: [],
			outputs: [],
			content: {
				type: "imageGeneration",
				llm,
			},
		}) satisfies ImageGenerationNode;

	const createFileNode = (
		id: NodeId,
		category: "text" | "pdf" | "image" = "text",
	): FileNode => ({
		id,
		type: "variable",
		inputs: [],
		outputs: [],
		content: {
			type: "file",
			category,
			files: [],
		},
	});

	const createActionNode = (id: NodeId): ActionNode => ({
		id,
		type: "operation",
		inputs: [],
		outputs: [],
		content: {
			type: "action",
			command: {
				provider: "github",
				state: { status: "unconfigured" },
			},
		},
	});

	const createGitHubNode = (id: NodeId): GitHubNode => ({
		id,
		type: "variable",
		inputs: [],
		outputs: [],
		content: {
			type: "github",
			objectReferences: [],
		},
	});

	const createTextNode = (id: NodeId): VariableNode => ({
		id,
		type: "variable",
		inputs: [],
		outputs: [],
		content: {
			type: "text",
			text: "",
		},
	});

	const createVectorStoreNode = (id: NodeId): VectorStoreNode => ({
		id,
		type: "variable",
		inputs: [],
		outputs: [],
		content: {
			type: "vectorStore",
			source: { provider: "github", state: { status: "unconfigured" } },
		},
	});

	const createTriggerNode = (id: NodeId): TriggerNode => ({
		id,
		type: "operation",
		inputs: [],
		outputs: [],
		content: {
			type: "trigger",
			provider: "manual",
			state: { status: "unconfigured" },
		},
	});

	const createQueryNode = (id: NodeId): QueryNode => ({
		id,
		type: "operation",
		inputs: [],
		outputs: [],
		content: {
			type: "query",
			query: "test query",
		},
	});

	const createAppEntryNode = (id: NodeId): AppEntryNode => ({
		id,
		type: "operation",
		inputs: [],
		outputs: [],
		content: {
			type: "appEntry",
			status: "unconfigured",
			draftApp: {
				name: "test",
				description: "test",
				iconName: "test",
				parameters: [],
			},
		},
	});

	const createEndNode = (id: NodeId): EndNode => ({
		id,
		type: "operation",
		inputs: [],
		outputs: [],
		content: {
			type: "end",
		},
	});

	const createDataStoreNode = (id: NodeId): DataStoreNode => ({
		id,
		type: "variable",
		inputs: [],
		outputs: [],
		content: {
			type: "dataStore",
			state: { status: "unconfigured" },
		},
	});

	const createDataQueryNode = (id: NodeId): DataQueryNode => ({
		id,
		type: "operation",
		inputs: [],
		outputs: [],
		content: {
			type: "dataQuery",
			query: "test query",
		},
	});

	const createWebPageNode = (id: NodeId): WebPageNode => ({
		id,
		type: "variable",
		inputs: [],
		outputs: [],
		content: {
			type: "webPage",
			webpages: [],
		},
	});

	const createContentGenerationNode = (id: NodeId): ContentGenerationNode => ({
		id,
		type: "operation",
		inputs: [],
		outputs: [],
		content: {
			type: "contentGeneration",
			version: "v1",
			prompt: "",
			languageModel: {
				provider: "anthropic",
				id: "anthropic/claude-opus-4.5",
				configuration: {},
			},
			tools: [],
			outputConfiguration: { outputFormat: "text" },
		},
	});

	describe("Basic validation", () => {
		test("should reject connection between the same node", () => {
			const node = createTextGenerationNode("nd-test1");
			const result = isSupportedConnection(node, node);

			expect(result.canConnect).toBe(false);
			expect(result).toHaveProperty(
				"message",
				"Connecting to the same node is not allowed",
			);
		});

		test("should reject non-action node as input", () => {
			const outputNode = createTextGenerationNode("nd-test2");
			const inputNode = createTextNode("nd-test3");

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(false);
			expect(result).toHaveProperty(
				"message",
				"This node does not receive inputs",
			);
		});
	});

	describe("v2container restrictions", () => {
		test("should reject connection between AppEntryNode and EndNode", () => {
			const appEntryNode = createAppEntryNode(NodeId.generate());
			const endNode = createEndNode(NodeId.generate());

			const result1 = isSupportedConnection(appEntryNode, endNode);
			expect(result1.canConnect).toBe(false);
			if (!result1.canConnect) {
				expect(result1.message).toBe(
					"Connecting Start and End nodes is not allowed",
				);
			}

			const result2 = isSupportedConnection(endNode, appEntryNode);
			expect(result2.canConnect).toBe(false);
			if (!result2.canConnect) {
				expect(result2.message).toBe(
					"Connecting Start and End nodes is not allowed",
				);
			}
		});
	});

	describe("Output node restrictions", () => {
		test("should reject GitHub node as output", () => {
			const outputNode = createGitHubNode("nd-test6");
			const inputNode = createTextGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(false);
			expect(result).toHaveProperty(
				"message",
				"GitHub node is not supported as an output",
			);
		});
	});

	describe("File node restrictions", () => {
		test("should reject pdf file node as input for image generation", () => {
			const fileNode = createFileNode(NodeId.generate(), "pdf");
			const inputNode = createImageGenerationNode(NodeId.generate());

			const result = isSupportedConnection(fileNode, inputNode);

			expect(result.canConnect).toBe(false);
			expect(result).toHaveProperty(
				"message",
				"File node is not supported as an input for this node",
			);
		});

		test("should reject pdf file node as input for OpenAI", () => {
			const fileNode = createFileNode(NodeId.generate(), "pdf");
			const inputNode = createTextGenerationNode(
				NodeId.generate(),
				openaiLanguageModels[0],
			);

			const result = isSupportedConnection(fileNode, inputNode);

			expect(result.canConnect).toBe(false);
			expect(result).toHaveProperty(
				"message",
				"File node is not supported as an input for this node",
			);
		});

		test("should reject image file node as input for Perplexity", () => {
			const fileNode = createFileNode(NodeId.generate(), "image");
			const inputNode = createTextGenerationNode(
				NodeId.generate(),
				perplexityLanguageModels[0],
			);

			const result = isSupportedConnection(fileNode, inputNode);

			expect(result.canConnect).toBe(false);
			expect(result).toHaveProperty(
				"message",
				"File node is not supported as an input for this node",
			);
		});

		test("should allow file node as input for Anthropic", () => {
			const fileNode = createFileNode(NodeId.generate());
			const inputNode = createTextGenerationNode(
				NodeId.generate(),
				anthropicLanguageModels[0],
			);

			const result = isSupportedConnection(fileNode, inputNode);
			expect(result.canConnect).toBe(true);
		});

		test.each([
			["text", true],
			["pdf", true],
			["image", true],
		])("should handle %s file category correctly", (category, expected) => {
			const fileNode = createFileNode(
				"nd-test16",
				category as "text" | "pdf" | "image",
			);
			const inputNode = createTextGenerationNode(
				NodeId.generate(),
				anthropicLanguageModels[0],
			);

			const result = isSupportedConnection(fileNode, inputNode);
			expect(result.canConnect).toBe(expected);
		});
	});

	describe("Vector store node restrictions", () => {
		test("should allow connection from VectorStoreNode to QueryNode", () => {
			const outputNode = createVectorStoreNode(NodeId.generate());
			const inputNode = createQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(true);
		});

		test("should reject connection from VectorStoreNode to non-QueryNode", () => {
			const outputNode = createVectorStoreNode(NodeId.generate());
			const inputNode = createTextGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(false);
			if (!result.canConnect) {
				expect(result.message).toBe(
					"Vector store node can only be connected to query node",
				);
			}
		});
	});

	describe("Data store node restrictions", () => {
		test("should allow connection from DataStoreNode to DataQueryNode", () => {
			const outputNode = createDataStoreNode(NodeId.generate());
			const inputNode = createDataQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(true);
		});

		test("should allow connection from DataStoreNode to TextGenerationNode", () => {
			const outputNode = createDataStoreNode(NodeId.generate());
			const inputNode = createTextGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(true);
		});

		test("should allow connection from DataStoreNode to ImageGenerationNode", () => {
			const outputNode = createDataStoreNode(NodeId.generate());
			const inputNode = createImageGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(true);
		});

		test("should allow connection from DataStoreNode to ContentGenerationNode", () => {
			const outputNode = createDataStoreNode(NodeId.generate());
			const inputNode = createContentGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(true);
		});

		test("should reject connection from DataStoreNode to non-supported node", () => {
			const outputNode = createDataStoreNode(NodeId.generate());
			const inputNode = createActionNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(false);
			if (!result.canConnect) {
				expect(result.message).toBe(
					"Data store node can only be connected to data query or generation nodes",
				);
			}
		});

		test("should reject connection from DataStoreNode to QueryNode", () => {
			const outputNode = createDataStoreNode(NodeId.generate());
			const inputNode = createQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(false);
			if (!result.canConnect) {
				expect(result.message).toBe(
					"Data store node can only be connected to data query or generation nodes",
				);
			}
		});

		test("should reject connection when DataQueryNode already has a DataStoreNode connected", () => {
			const existingDataStoreNode = createDataStoreNode(NodeId.generate());
			const newDataStoreNode = createDataStoreNode(NodeId.generate());
			const dataQueryNode = createDataQueryNode(NodeId.generate());

			// Create a mock existing connection
			const existingConnections = [
				{
					id: "cnnc-existing" as const,
					outputNode: {
						id: existingDataStoreNode.id,
						type: existingDataStoreNode.type,
						content: existingDataStoreNode.content,
					},
					outputId: "otp-1" as const,
					inputNode: {
						id: dataQueryNode.id,
						type: dataQueryNode.type,
						content: dataQueryNode.content,
					},
					inputId: "inp-1" as const,
				},
			];

			const result = isSupportedConnection(newDataStoreNode, dataQueryNode, {
				existingConnections,
			});

			expect(result.canConnect).toBe(false);
			if (!result.canConnect) {
				expect(result.message).toBe(
					"Data Query node can only have one Data Store connected",
				);
			}
		});

		test("should allow connection when DataQueryNode has no DataStoreNode connected", () => {
			const dataStoreNode = createDataStoreNode(NodeId.generate());
			const dataQueryNode = createDataQueryNode(NodeId.generate());

			const result = isSupportedConnection(dataStoreNode, dataQueryNode, {
				existingConnections: [],
			});

			expect(result.canConnect).toBe(true);
		});

		test("should allow connection when existingConnections is not provided", () => {
			const dataStoreNode = createDataStoreNode(NodeId.generate());
			const dataQueryNode = createDataQueryNode(NodeId.generate());

			const result = isSupportedConnection(dataStoreNode, dataQueryNode);

			expect(result.canConnect).toBe(true);
		});

		test("should allow non-DataStore nodes to connect to DataQuery even when DataStore is already connected", () => {
			const existingDataStoreNode = createDataStoreNode(NodeId.generate());
			const textNode = createTextNode(NodeId.generate());
			const dataQueryNode = createDataQueryNode(NodeId.generate());

			// Data Query already has a Data Store connected
			const existingConnections = [
				{
					id: "cnnc-existing" as const,
					outputNode: {
						id: existingDataStoreNode.id,
						type: existingDataStoreNode.type,
						content: existingDataStoreNode.content,
					},
					outputId: "otp-1" as const,
					inputNode: {
						id: dataQueryNode.id,
						type: dataQueryNode.type,
						content: dataQueryNode.content,
					},
					inputId: "inp-1" as const,
				},
			];

			// Text node should still be able to connect
			const result = isSupportedConnection(textNode, dataQueryNode, {
				existingConnections,
			});

			expect(result.canConnect).toBe(true);
		});
	});

	describe("Image generation node restrictions", () => {
		test("should allow Image Generation Node as input for Google(Nano banana)", () => {
			const outputNode = createImageGenerationNode(NodeId.generate());
			const nanoBanana = googleImageLanguageModels.find(
				(m) => m.id === "gemini-2.5-flash-image",
			);
			const inputNode = createImageGenerationNode(
				NodeId.generate(),
				nanoBanana,
			);

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(true);
		});

		test("should reject GitHubNode as input", () => {
			const outputNode = createGitHubNode(NodeId.generate());
			const inputNode = createImageGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(false);
			if (!result.canConnect) {
				expect(result.message).toBe(
					"GitHub node is not supported as an input for this node",
				);
			}
		});
	});

	describe("Query node output restrictions", () => {
		test("should allow connection from QueryNode to TextGenerationNode", () => {
			const outputNode = createQueryNode(NodeId.generate());
			const inputNode = createTextGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(true);
		});

		test("should allow connection from QueryNode to ImageGenerationNode", () => {
			const outputNode = createQueryNode(NodeId.generate());
			const inputNode = createImageGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(true);
		});

		test("should reject connection from QueryNode to a non-Text/ImageGenerationNode (e.g., ActionNode)", () => {
			const outputNode = createQueryNode(NodeId.generate());
			const inputNode = createActionNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(false);
			if (!result.canConnect) {
				expect(result.message).toBe(
					"Query node can only be connected to text generation or image generation",
				);
			}
		});
	});

	describe("Data query node output restrictions", () => {
		test("should allow connection from DataQueryNode to TextGenerationNode", () => {
			const outputNode = createDataQueryNode(NodeId.generate());
			const inputNode = createTextGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(true);
		});

		test("should allow connection from DataQueryNode to ImageGenerationNode", () => {
			const outputNode = createDataQueryNode(NodeId.generate());
			const inputNode = createImageGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(true);
		});

		test("should allow connection from DataQueryNode to ContentGenerationNode", () => {
			const outputNode = createDataQueryNode(NodeId.generate());
			const inputNode = createContentGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(true);
		});

		test("should reject connection from DataQueryNode to ActionNode", () => {
			const outputNode = createDataQueryNode(NodeId.generate());
			const inputNode = createActionNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(false);
			if (!result.canConnect) {
				expect(result.message).toBe(
					"Data query node can only be connected to text generation, image generation, or content generation",
				);
			}
		});

		test("should reject connection from DataQueryNode to QueryNode", () => {
			const outputNode = createDataQueryNode(NodeId.generate());
			const inputNode = createQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(false);
			if (!result.canConnect) {
				expect(result.message).toBe(
					"Data query node can only be connected to text generation, image generation, or content generation",
				);
			}
		});
	});

	describe("Data query node input restrictions", () => {
		test("should allow connection from DataStoreNode to DataQueryNode", () => {
			const outputNode = createDataStoreNode(NodeId.generate());
			const inputNode = createDataQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(true);
		});

		test("should allow connection from TextNode to DataQueryNode", () => {
			const outputNode = createTextNode(NodeId.generate());
			const inputNode = createDataQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(true);
		});

		test("should allow connection from TriggerNode to DataQueryNode", () => {
			const outputNode = createTriggerNode(NodeId.generate());
			const inputNode = createDataQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(true);
		});

		test("should allow connection from ActionNode to DataQueryNode", () => {
			const outputNode = createActionNode(NodeId.generate());
			const inputNode = createDataQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(true);
		});

		test("should allow connection from AppEntryNode to DataQueryNode", () => {
			const outputNode = createAppEntryNode(NodeId.generate());
			const inputNode = createDataQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(true);
		});

		test("should allow connection from TextGenerationNode to DataQueryNode", () => {
			const outputNode = createTextGenerationNode(NodeId.generate());
			const inputNode = createDataQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(true);
		});

		test("should allow connection from ContentGenerationNode to DataQueryNode", () => {
			const outputNode = createContentGenerationNode(NodeId.generate());
			const inputNode = createDataQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(true);
		});

		test("should reject connection from WebPageNode to DataQueryNode", () => {
			const outputNode = createWebPageNode(NodeId.generate());
			const inputNode = createDataQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(false);
			if (!result.canConnect) {
				expect(result.message).toBe(
					"This node is not supported as an input for Data Query",
				);
			}
		});

		test("should reject connection from VectorStoreNode to DataQueryNode", () => {
			const outputNode = createVectorStoreNode(NodeId.generate());
			const inputNode = createDataQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(false);
			if (!result.canConnect) {
				expect(result.message).toBe(
					"Vector store node can only be connected to query node",
				);
			}
		});

		test("should reject connection from FileNode to DataQueryNode", () => {
			const outputNode = createFileNode(NodeId.generate());
			const inputNode = createDataQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(false);
			if (!result.canConnect) {
				expect(result.message).toBe(
					"File node is not supported as an input for this node",
				);
			}
		});

		test("should reject connection from GitHubNode to DataQueryNode", () => {
			const outputNode = createGitHubNode(NodeId.generate());
			const inputNode = createDataQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(false);
			if (!result.canConnect) {
				expect(result.message).toBe(
					"GitHub node is not supported as an output",
				);
			}
		});
	});

	describe("Valid connections", () => {
		test("should allow valid connection between compatible nodes", () => {
			const outputNode = createTextGenerationNode(NodeId.generate());
			const inputNode = createTextGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(true);
			expect(result).not.toHaveProperty("message");
		});

		test("should allow TriggerNode to connect to TextGenerationNode", () => {
			const outputNode = createTriggerNode(NodeId.generate());
			const inputNode = createTextGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(true);
		});

		test("should allow ActionNode to connect to TextGenerationNode", () => {
			const outputNode = createActionNode(NodeId.generate());
			const inputNode = createTextGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(true);
		});

		test("should allow ActionNode to connect to QueryNode", () => {
			const outputNode = createActionNode(NodeId.generate());
			const inputNode = createQueryNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(true);
		});
	});
});
