import type {
	ActionNode,
	FileNode,
	GitHubNode,
	ImageGenerationLanguageModelData,
	ImageGenerationNode,
	QueryNode,
	TextGenerationLanguageModelData,
	TextGenerationNode,
	VariableNode,
	VectorStoreNode,
} from "@giselle-sdk/data-type";
import { NodeId } from "@giselle-sdk/data-type";
import {
	anthropicLanguageModels,
	falLanguageModels,
	openaiLanguageModels,
	perplexityLanguageModels,
} from "@giselle-sdk/language-model";
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

	describe("Output node restrictions", () => {
		test("should reject image generation node as output", () => {
			const outputNode = createImageGenerationNode("nd-test4");
			const inputNode = createTextGenerationNode(NodeId.generate());

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(false);
			expect(result).toHaveProperty(
				"message",
				"Image generation node is not supported as an output",
			);
		});

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
			const outputNode = createQueryNode("nd-query-out-3");
			const inputNode = createActionNode("nd-action-in-1");

			const result = isSupportedConnection(outputNode, inputNode);
			expect(result.canConnect).toBe(false);
			if (!result.canConnect) {
				expect(result.message).toBe(
					"Query node can only be connected to text generation or image generation",
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
	});
});
