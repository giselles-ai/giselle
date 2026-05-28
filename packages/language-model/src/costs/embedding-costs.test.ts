import { describe, expect, it } from "vitest";
import { calculateEmbeddingDisplayCost } from "./index";

describe("calculateEmbeddingDisplayCost", () => {
	it("computes cost for OpenAI text-embedding-3-small", async () => {
		const cost = await calculateEmbeddingDisplayCost(
			"openai",
			"text-embedding-3-small",
			{ tokens: 1000 },
		);
		// $0.02 per 1M tokens => 1000 tokens = $0.00002
		expect(cost.totalCostForDisplay).toBeCloseTo(0.00002, 10);
	});

	it("computes cost for OpenAI text-embedding-3-large", async () => {
		const cost = await calculateEmbeddingDisplayCost(
			"openai",
			"text-embedding-3-large",
			{ tokens: 2000 },
		);
		// $0.13 per 1M tokens => 2000 tokens = $0.00026
		expect(cost.totalCostForDisplay).toBeCloseTo(0.00026, 10);
	});

	it("computes cost for Google gemini-embedding-001", async () => {
		const cost = await calculateEmbeddingDisplayCost(
			"google",
			"gemini-embedding-001",
			{ tokens: 1000 },
		);
		// $0.15 per 1M tokens => 1000 tokens = $0.00015
		expect(cost.totalCostForDisplay).toBeCloseTo(0.00015, 10);
	});
});
