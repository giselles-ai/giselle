import type { TextGenerationNode } from "@giselles-ai/protocol";
import { describe, expect, it } from "vitest";
import {
	anthropicClaudeOpus45,
	anthropicClaudeSonnet,
	googleGemini,
	openAI_1,
	openAIWithEmptyTools,
	openAIWithGitHubTool,
	openAIWithoutTools,
} from "./__fixtures__/node-conversion/nodes";
import {
	convertContentGenerationToTextGeneration,
	convertTextGenerationToContentGeneration,
} from "./node-conversion";

type OpenAITextGenerationModelId = Extract<
	TextGenerationNode["content"]["llm"],
	{ provider: "openai" }
>["id"];

function createOpenAITextNode(
	modelId: OpenAITextGenerationModelId,
): TextGenerationNode {
	return {
		id: `nd-${modelId}`,
		name: `Node ${modelId}`,
		type: "operation",
		inputs: [],
		outputs: [],
		content: {
			type: "textGeneration",
			llm: {
				provider: "openai",
				id: modelId,
				configurations: {
					temperature: 0.7,
					topP: 1,
					presencePenalty: 0,
					frequencyPenalty: 0,
					textVerbosity: "medium",
					reasoningEffort: "medium",
				},
			},
			prompt: "test",
			outputConfiguration: { outputFormat: "text" },
		},
	};
}

describe("node-conversion", () => {
	const createGoogleGeminiNode = (
		llmOverrides?: Partial<TextGenerationNode["content"]["llm"]>,
	) =>
		({
			...googleGemini,
			content: {
				...googleGemini.content,
				llm: {
					...googleGemini.content.llm,
					...(llmOverrides ?? {}),
				},
			},
		}) as TextGenerationNode;

	describe("convertTextGenerationToContentGeneration", () => {
		it("should convert TextGenerationNode to ContentGenerationNode", () => {
			const textGenerationNode = openAI_1 as TextGenerationNode;
			const result =
				convertTextGenerationToContentGeneration(textGenerationNode);

			expect(result.content.type).toBe("contentGeneration");
			expect(result.content.version).toBe("v1");
			expect(result.content.languageModel.provider).toBe("openai");
			expect(result.content.languageModel.id).toBe("openai/gpt-5");
			expect(result.content.prompt).toBe(textGenerationNode.content.prompt);
		});

		it("should convert openaiWebSearch tool", () => {
			const textGenerationNode = openAI_1 as TextGenerationNode;
			const result =
				convertTextGenerationToContentGeneration(textGenerationNode);

			expect(result.content.tools).toHaveLength(1);
			expect(result.content.tools[0]?.name).toBe("openai-web-search");
			expect(result.content.tools[0]?.configuration).toEqual({});
		});

		it("should convert GitHub tool", () => {
			const textGenerationNode = openAIWithGitHubTool as TextGenerationNode;
			const result =
				convertTextGenerationToContentGeneration(textGenerationNode);

			expect(result.content.tools).toHaveLength(1);
			expect(result.content.tools[0]?.name).toBe("github-api");
			expect(result.content.tools[0]?.configuration.secretId).toBe(
				"scrt-TESTTESTTESTTEST",
			);
			expect(result.content.tools[0]?.configuration.useTools).toEqual([
				"getIssue",
			]);
		});

		it("should preserve node metadata", () => {
			const textGenerationNode = openAI_1 as TextGenerationNode;
			const result =
				convertTextGenerationToContentGeneration(textGenerationNode);

			expect(result.id).toBe(textGenerationNode.id);
			expect(result.name).toBe(textGenerationNode.name);
			expect(result.type).toBe(textGenerationNode.type);
			expect(result.inputs).toEqual(textGenerationNode.inputs);
			expect(result.outputs).toEqual(textGenerationNode.outputs);
		});

		it("should handle node without tools", () => {
			const textGenerationNode = openAIWithoutTools as TextGenerationNode;
			const result =
				convertTextGenerationToContentGeneration(textGenerationNode);

			expect(result.content.tools).toHaveLength(0);
			expect(result.content.languageModel.provider).toBe("openai");
			expect(result.content.languageModel.id).toBe("openai/gpt-5");
		});

		it("should handle node with empty tools object", () => {
			const textGenerationNode = openAIWithEmptyTools as TextGenerationNode;
			const result =
				convertTextGenerationToContentGeneration(textGenerationNode);

			expect(result.content.tools).toHaveLength(0);
			expect(result.content.languageModel.provider).toBe("openai");
			expect(result.content.languageModel.id).toBe("openai/gpt-5-nano");
		});

		it("should convert Anthropic Claude model", () => {
			const textGenerationNode = anthropicClaudeSonnet as TextGenerationNode;
			const result =
				convertTextGenerationToContentGeneration(textGenerationNode);

			expect(result.content.languageModel.provider).toBe("anthropic");
			expect(result.content.languageModel.id).toBe(
				"anthropic/claude-sonnet-4-5",
			);
		});

		it("should convert Anthropic Claude Opus 4.5 model", () => {
			const textGenerationNode = anthropicClaudeOpus45 as TextGenerationNode;
			const result =
				convertTextGenerationToContentGeneration(textGenerationNode);

			expect(result.content.languageModel.provider).toBe("anthropic");
			expect(result.content.languageModel.id).toBe("anthropic/claude-opus-4.5");
		});

		it("should convert Google Gemini model", () => {
			const textGenerationNode = googleGemini as TextGenerationNode;
			const result =
				convertTextGenerationToContentGeneration(textGenerationNode);

			expect(result.content.languageModel.provider).toBe("google");
			expect(result.content.languageModel.id).toBe("google/gemini-2.5-flash");
		});

		it("should convert Google Gemini 3 Pro Preview model", () => {
			const textGenerationNode = createGoogleGeminiNode({
				id: "gemini-3-pro-preview",
			});
			const result =
				convertTextGenerationToContentGeneration(textGenerationNode);

			expect(result.content.languageModel.provider).toBe("google");
			expect(result.content.languageModel.id).toBe(
				"google/gemini-3-pro-preview",
			);
		});

		it("should convert GPT-5.1 models", () => {
			const modelIds: OpenAITextGenerationModelId[] = [
				"gpt-5.1-thinking",
				"gpt-5.1-codex",
			];
			for (const modelId of modelIds) {
				const textGenerationNode = createOpenAITextNode(modelId);
				const result =
					convertTextGenerationToContentGeneration(textGenerationNode);

				expect(result.content.languageModel.id).toBe(
					modelId === "gpt-5.1-thinking"
						? "openai/gpt-5.1-thinking"
						: "openai/gpt-5.1-codex",
				);
			}
		});
	});

	describe("convertContentGenerationToTextGeneration", () => {
		it("should convert ContentGenerationNode to TextGenerationNode", () => {
			const textGenerationNode = openAI_1 as TextGenerationNode;
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(textGenerationNode);
			const result = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(result.content.type).toBe("textGeneration");
			expect(result.content.llm?.provider).toBe("openai");
			expect(result.content.llm?.id).toBe("gpt-5");
			expect(result.content.prompt).toBe(textGenerationNode.content.prompt);
		});

		it("should convert openai-web-search tool back", () => {
			const textGenerationNode = openAI_1 as TextGenerationNode;
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(textGenerationNode);
			const result = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(result.content.tools?.openaiWebSearch).toBeDefined();
			expect(result.content.tools?.openaiWebSearch?.searchContextSize).toBe(
				"medium",
			);
		});

		it("should convert github-api tool back", () => {
			const textGenerationNode = openAIWithGitHubTool as TextGenerationNode;
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(textGenerationNode);
			const result = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(result.content.tools?.github).toBeDefined();
			expect(result.content.tools?.github?.auth.type).toBe("secret");
			// @ts-expect-error - Test file: fixture may have type mismatch
			expect(result.content.tools?.github?.auth.secretId).toBe(
				"scrt-TESTTESTTESTTEST",
			);
			expect(result.content.tools?.github?.tools).toEqual(["getIssue"]);
		});

		it("should preserve node metadata", () => {
			const textGenerationNode = openAI_1 as TextGenerationNode;
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(textGenerationNode);
			const result = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(result.id).toBe(textGenerationNode.id);
			expect(result.name).toBe(textGenerationNode.name);
			expect(result.type).toBe(textGenerationNode.type);
			expect(result.inputs).toEqual(textGenerationNode.inputs);
			expect(result.outputs).toEqual(textGenerationNode.outputs);
		});

		it("should convert Anthropic Claude model back", () => {
			const textGenerationNode = anthropicClaudeSonnet as TextGenerationNode;
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(textGenerationNode);
			const result = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(result.content.llm?.provider).toBe("anthropic");
			expect(result.content.llm?.id).toBe("claude-sonnet-4.5");
		});

		it("should convert Anthropic Claude Opus 4.5 model back", () => {
			const textGenerationNode = anthropicClaudeOpus45 as TextGenerationNode;
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(textGenerationNode);
			const result = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(result.content.llm?.provider).toBe("anthropic");
			expect(result.content.llm?.id).toBe("claude-opus-4.5");
		});

		it("should convert Google Gemini model back", () => {
			const textGenerationNode = googleGemini as TextGenerationNode;
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(textGenerationNode);
			const result = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(result.content.llm?.provider).toBe("google");
			expect(result.content.llm?.id).toBe("gemini-2.5-flash");
		});

		it("should convert Google Gemini 3 Pro Preview model back", () => {
			const textGenerationNode = createGoogleGeminiNode({
				id: "gemini-3-pro-preview",
			});
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(textGenerationNode);
			const result = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(result.content.llm?.provider).toBe("google");
			expect(result.content.llm?.id).toBe("gemini-3-pro-preview");
		});

		it("should handle node without tools when converting back", () => {
			const textGenerationNode = openAIWithoutTools as TextGenerationNode;
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(textGenerationNode);
			const result = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(result.content.tools).toBeUndefined();
		});

		it("should convert GPT-5.1 language models back to text generation nodes", () => {
			const modelIds: Array<
				"openai/gpt-5.1-thinking" | "openai/gpt-5.1-codex"
			> = ["openai/gpt-5.1-thinking", "openai/gpt-5.1-codex"];
			for (const modelId of modelIds) {
				const textGenerationNode = createOpenAITextNode(
					modelId === "openai/gpt-5.1-thinking"
						? ("gpt-5.1-thinking" as OpenAITextGenerationModelId)
						: ("gpt-5.1-codex" as OpenAITextGenerationModelId),
				);
				const contentGenerationNode =
					convertTextGenerationToContentGeneration(textGenerationNode);

				const result = convertContentGenerationToTextGeneration(
					contentGenerationNode,
				);

				expect(result.content.llm?.id).toBe(
					modelId === "openai/gpt-5.1-thinking"
						? "gpt-5.1-thinking"
						: "gpt-5.1-codex",
				);
			}
		});
	});

	describe("round-trip conversion", () => {
		it("should preserve data through round-trip conversion with openaiWebSearch", () => {
			const originalNode = openAI_1 as TextGenerationNode;
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(originalNode);
			const convertedBack = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(convertedBack.content.type).toBe(originalNode.content.type);
			expect(convertedBack.content.llm?.provider).toBe(
				originalNode.content.llm.provider,
			);
			expect(convertedBack.content.llm?.id).toBe(originalNode.content.llm.id);
			expect(convertedBack.content.prompt).toBe(originalNode.content.prompt);
			expect(convertedBack.content.outputConfiguration).toEqual(
				originalNode.content.outputConfiguration,
			);
			expect(convertedBack.content.tools?.openaiWebSearch).toBeDefined();
		});

		it("should preserve data through round-trip conversion with GitHub tool", () => {
			const originalNode = openAIWithGitHubTool as TextGenerationNode;
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(originalNode);
			const convertedBack = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(convertedBack.content.type).toBe(originalNode.content.type);
			expect(convertedBack.content.llm?.provider).toBe(
				originalNode.content.llm.provider,
			);
			expect(convertedBack.content.llm?.id).toBe(originalNode.content.llm.id);
			expect(convertedBack.content.prompt).toBe(originalNode.content.prompt);
			expect(convertedBack.content.outputConfiguration).toEqual(
				originalNode.content.outputConfiguration,
			);
			expect(convertedBack.content.tools?.github).toBeDefined();
			expect(convertedBack.content.tools?.github?.auth.type).toBe("secret");
			// @ts-expect-error - Test file: fixture may have type mismatch
			expect(convertedBack.content.tools?.github?.auth.secretId).toBe(
				// @ts-expect-error - Test file: fixture may have type mismatch
				originalNode.content.tools?.github?.auth.secretId,
			);
			expect(convertedBack.content.tools?.github?.tools).toEqual(
				originalNode.content.tools?.github?.tools,
			);
		});

		it("should preserve data through round-trip conversion without tools", () => {
			const originalNode = openAIWithoutTools as TextGenerationNode;
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(originalNode);
			const convertedBack = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(convertedBack.content.type).toBe(originalNode.content.type);
			expect(convertedBack.content.llm?.provider).toBe(
				originalNode.content.llm.provider,
			);
			expect(convertedBack.content.llm?.id).toBe(originalNode.content.llm.id);
			expect(convertedBack.content.prompt).toBe(originalNode.content.prompt);
			expect(convertedBack.content.outputConfiguration).toEqual(
				originalNode.content.outputConfiguration,
			);
			expect(convertedBack.content.tools).toBeUndefined();
		});

		it("should preserve data through round-trip conversion with Anthropic Claude", () => {
			const originalNode = anthropicClaudeSonnet as TextGenerationNode;
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(originalNode);
			const convertedBack = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(convertedBack.content.type).toBe(originalNode.content.type);
			expect(convertedBack.content.llm?.provider).toBe(
				originalNode.content.llm.provider,
			);
			expect(convertedBack.content.llm?.id).toBe(originalNode.content.llm.id);
			expect(convertedBack.content.prompt).toBe(originalNode.content.prompt);
			expect(convertedBack.content.outputConfiguration).toEqual(
				originalNode.content.outputConfiguration,
			);
		});

		it("should preserve data through round-trip conversion with Anthropic Claude Opus 4.5", () => {
			const originalNode = anthropicClaudeOpus45 as TextGenerationNode;
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(originalNode);
			const convertedBack = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(convertedBack.content.type).toBe(originalNode.content.type);
			expect(convertedBack.content.llm?.provider).toBe(
				originalNode.content.llm.provider,
			);
			expect(convertedBack.content.llm?.id).toBe(originalNode.content.llm.id);
			expect(convertedBack.content.prompt).toBe(originalNode.content.prompt);
			expect(convertedBack.content.outputConfiguration).toEqual(
				originalNode.content.outputConfiguration,
			);
		});

		it("should preserve data through round-trip conversion with Google Gemini", () => {
			const originalNode = googleGemini as TextGenerationNode;
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(originalNode);
			const convertedBack = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(convertedBack.content.type).toBe(originalNode.content.type);
			expect(convertedBack.content.llm?.provider).toBe(
				originalNode.content.llm.provider,
			);
			expect(convertedBack.content.llm?.id).toBe(originalNode.content.llm.id);
			expect(convertedBack.content.prompt).toBe(originalNode.content.prompt);
			expect(convertedBack.content.outputConfiguration).toEqual(
				originalNode.content.outputConfiguration,
			);
		});

		it("should preserve data through round-trip conversion with Google Gemini 3 Pro Preview", () => {
			const originalNode = createGoogleGeminiNode({
				id: "gemini-3-pro-preview",
			});
			const contentGenerationNode =
				convertTextGenerationToContentGeneration(originalNode);
			const convertedBack = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(convertedBack.content.type).toBe(originalNode.content.type);
			expect(convertedBack.content.llm?.provider).toBe(
				originalNode.content.llm.provider,
			);
			expect(convertedBack.content.llm?.id).toBe(originalNode.content.llm.id);
			expect(convertedBack.content.prompt).toBe(originalNode.content.prompt);
			expect(convertedBack.content.outputConfiguration).toEqual(
				originalNode.content.outputConfiguration,
			);
		});

		it("should preserve data through round-trip conversion for GPT-5.1 models", () => {
			const originalNode = createOpenAITextNode("gpt-5.1-thinking");

			const contentGenerationNode =
				convertTextGenerationToContentGeneration(originalNode);
			const convertedBack = convertContentGenerationToTextGeneration(
				contentGenerationNode,
			);

			expect(convertedBack.content.type).toBe(originalNode.content.type);
			expect(convertedBack.content.llm?.provider).toBe(
				originalNode.content.llm.provider,
			);
			expect(convertedBack.content.llm?.id).toBe(originalNode.content.llm.id);
			expect(convertedBack.content.prompt).toBe(originalNode.content.prompt);
			expect(convertedBack.content.outputConfiguration).toEqual(
				originalNode.content.outputConfiguration,
			);
			expect(convertedBack.content.llm?.id).toBe("gpt-5.1-thinking");
		});
	});
});
