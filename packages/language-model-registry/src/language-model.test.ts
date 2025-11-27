import { describe, expect, it } from "vitest";
import { anthropic } from "./anthropic";
import { google } from "./google";
import { parseConfiguration } from "./language-model";
import { openai } from "./openai";

describe("parseConfiguration", () => {
	describe("with anthropic/claude-opus-4.1", () => {
		const model = anthropic["anthropic/claude-opus-4.1"];

		it("should parse valid configuration", () => {
			const unknownData: Record<string, unknown> = {
				temperature: 0.8,
				thinking: true,
			};

			const result = parseConfiguration(model, unknownData);

			expect(result.temperature).toBe(0.8);
			expect(result.thinking).toBe(true);
		});

		it("should fallback to default when value is invalid", () => {
			const unknownData: Record<string, unknown> = {
				temperature: 0.8,
				thinking: "true", // invalid: should be boolean
			};

			const result = parseConfiguration(model, unknownData);

			expect(result.temperature).toBe(0.8);
			expect(result.thinking).toBe(false); // falls back to default
		});

		it("should fallback to default when value is out of range", () => {
			const unknownData: Record<string, unknown> = {
				temperature: 2.0, // invalid: max is 1.0
				thinking: true,
			};

			const result = parseConfiguration(model, unknownData);

			expect(result.temperature).toBe(1.0); // falls back to default
			expect(result.thinking).toBe(true);
		});

		it("should use defaults when value is missing", () => {
			const unknownData: Record<string, unknown> = {
				temperature: 0.8,
				// thinking is missing
			};

			const result = parseConfiguration(model, unknownData);

			expect(result.temperature).toBe(0.8);
			expect(result.thinking).toBe(false); // uses default
		});

		it("should use all defaults when data is empty", () => {
			const unknownData: Record<string, unknown> = {};

			const result = parseConfiguration(model, unknownData);

			expect(result.temperature).toBe(1.0);
			expect(result.thinking).toBe(false);
		});

		it("should ignore unknown keys", () => {
			const unknownData: Record<string, unknown> = {
				temperature: 0.8,
				thinking: true,
				unknownKey: "should be ignored",
			};

			const result = parseConfiguration(model, unknownData);

			expect(result.temperature).toBe(0.8);
			expect(result.thinking).toBe(true);
			expect("unknownKey" in result).toBe(false);
		});
	});

	describe("with openai/gpt-5.1-thinking", () => {
		const model = openai["openai/gpt-5.1-thinking"];

		it("should parse valid enum values", () => {
			const unknownData: Record<string, unknown> = {
				reasoningEffort: "high",
				textVerbosity: "low",
			};

			const result = parseConfiguration(model, unknownData);

			expect(result.reasoningEffort).toBe("high");
			expect(result.textVerbosity).toBe("low");
		});

		it("should fallback to default when enum value is invalid", () => {
			const unknownData: Record<string, unknown> = {
				reasoningEffort: "invalid", // invalid enum value
				textVerbosity: "medium",
			};

			const result = parseConfiguration(model, unknownData);

			expect(result.reasoningEffort).toBe("none"); // falls back to default
			expect(result.textVerbosity).toBe("medium");
		});

		it("should handle type mismatches", () => {
			const unknownData: Record<string, unknown> = {
				reasoningEffort: 123, // invalid: should be string enum
				textVerbosity: true, // invalid: should be string enum
			};

			const result = parseConfiguration(model, unknownData);

			expect(result.reasoningEffort).toBe("none"); // falls back to default
			expect(result.textVerbosity).toBe("medium"); // falls back to default
		});
	});

	describe("with google/gemini-3-pro-preview", () => {
		const model = google["google/gemini-3-pro-preview"];

		it("should parse valid configuration with multiple types", () => {
			const unknownData: Record<string, unknown> = {
				temperature: 1.5,
				thinkingLevel: "high",
				searchGrounding: true,
			};

			const result = parseConfiguration(model, unknownData);

			expect(result.temperature).toBe(1.5);
			expect(result.thinkingLevel).toBe("high");
			expect(result.searchGrounding).toBe(true);
		});

		it("should fallback to default when boolean is invalid", () => {
			const unknownData: Record<string, unknown> = {
				temperature: 1.0,
				thinkingLevel: "high",
				searchGrounding: "yes", // invalid: should be boolean
			};

			const result = parseConfiguration(model, unknownData);

			expect(result.temperature).toBe(1.0);
			expect(result.thinkingLevel).toBe("high");
			expect(result.searchGrounding).toBe(false); // falls back to default
		});

		it("should handle all invalid values", () => {
			const unknownData: Record<string, unknown> = {
				temperature: "hot", // invalid
				thinkingLevel: "very high", // invalid enum
				searchGrounding: "maybe", // invalid
			};

			const result = parseConfiguration(model, unknownData);

			expect(result.temperature).toBe(1.0); // default
			expect(result.thinkingLevel).toBe("high"); // default
			expect(result.searchGrounding).toBe(false); // default
		});
	});
});
