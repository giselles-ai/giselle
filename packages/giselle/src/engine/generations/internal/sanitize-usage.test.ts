import { describe, expect, it } from "vitest";

import type { GenerationUsage } from "../../../concepts/generation";
import { sanitizeGenerationUsage } from "./sanitize-usage";

describe("sanitizeGenerationUsage", () => {
	it("returns undefined when usage is undefined", () => {
		expect(sanitizeGenerationUsage(undefined)).toBeUndefined();
	});

	it("drops usage when every metric is non-finite", () => {
		const usage: GenerationUsage = {
			inputTokens: Number.NaN,
			outputTokens: Number.POSITIVE_INFINITY,
			totalTokens: Number.NaN,
			reasoningTokens: Number.NaN,
			cachedInputTokens: Number.NaN,
		};

		expect(sanitizeGenerationUsage(usage)).toBeUndefined();
	});

	it("keeps only finite values", () => {
		const usage: GenerationUsage = {
			inputTokens: 10,
			outputTokens: Number.NaN,
			totalTokens: 15,
			reasoningTokens: undefined,
			cachedInputTokens: Number.NaN,
		};

		const sanitized = sanitizeGenerationUsage(usage);
		if (sanitized === undefined) {
			throw new Error("sanitized usage should not be undefined");
		}

		expect(sanitized.inputTokens).toBe(10);
		expect(sanitized.outputTokens).toBeUndefined();
		expect(sanitized.totalTokens).toBe(15);
		expect(sanitized.reasoningTokens).toBeUndefined();
		expect(sanitized.cachedInputTokens).toBeUndefined();
	});
});
