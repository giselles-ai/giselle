import type {
	FileNode,
	GitHubNode,
	ImageGenerationLanguageModelData,
	ImageGenerationNode,
	NodeId,
	TextGenerationLanguageModelData,
	TextGenerationNode,
	VariableNode,
} from "@giselle-sdk/data-type";
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
	): TextGenerationNode => ({
		id,
		type: "operation",
		inputs: [],
		outputs: [],
		content: {
			type: "textGeneration",
			llm,
		},
	});

	const createImageGenerationNode = (
		id: NodeId,
		llm: ImageGenerationLanguageModelData = falLanguageModels[0],
	): ImageGenerationNode => ({
		id,
		type: "operation",
		inputs: [],
		outputs: [],
		content: {
			type: "imageGeneration",
			llm,
		},
	});

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
			const inputNode = createTextGenerationNode("nd-test5");

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(false);
			expect(result).toHaveProperty(
				"message",
				"Image generation node is not supported as an output",
			);
		});

		test("should reject GitHub node as output", () => {
			const outputNode = createGitHubNode("nd-test6");
			const inputNode = createTextGenerationNode("nd-test7");

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(false);
			expect(result).toHaveProperty(
				"message",
				"GitHub node is not supported as an output",
			);
		});
	});

	describe("File node restrictions", () => {
		test("should reject file node as input for image generation", () => {
			const fileNode = createFileNode("nd-test8");
			const inputNode = createImageGenerationNode("nd-test9");

			const result = isSupportedConnection(fileNode, inputNode);

			expect(result.canConnect).toBe(false);
			expect(result).toHaveProperty(
				"message",
				"File node is not supported as an input for Image Generation",
			);
		});

		test("should reject file node as input for OpenAI", () => {
			const fileNode = createFileNode("nd-test10");
			const inputNode = createTextGenerationNode(
				"nd-test11",
				openaiLanguageModels[0],
			);

			const result = isSupportedConnection(fileNode, inputNode);

			expect(result.canConnect).toBe(false);
			expect(result).toHaveProperty(
				"message",
				"File node is not supported as an input for OpenAI",
			);
		});

		test("should reject file node as input for Perplexity", () => {
			const fileNode = createFileNode("nd-test12");
			const inputNode = createTextGenerationNode(
				"nd-test13",
				perplexityLanguageModels[0],
			);

			const result = isSupportedConnection(fileNode, inputNode);

			expect(result.canConnect).toBe(false);
			expect(result).toHaveProperty(
				"message",
				"File node is not supported as an input for Perplexity",
			);
		});

		test("should allow file node as input for Anthropic", () => {
			const fileNode = createFileNode("nd-test14");
			const inputNode = createTextGenerationNode(
				"nd-test15",
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
				"nd-test17",
				anthropicLanguageModels[0],
			);

			const result = isSupportedConnection(fileNode, inputNode);
			expect(result.canConnect).toBe(expected);
		});
	});

	describe("Valid connections", () => {
		test("should allow valid connection between compatible nodes", () => {
			const outputNode = createTextGenerationNode("nd-test18");
			const inputNode = createTextGenerationNode("nd-test19");

			const result = isSupportedConnection(outputNode, inputNode);

			expect(result.canConnect).toBe(true);
			expect(result).not.toHaveProperty("message");
		});
	});
});
