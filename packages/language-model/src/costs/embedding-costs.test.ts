import { describe, expect, it } from "vitest";
import { calculateEmbeddingDisplayCost } from "./index";

describe("calculateEmbeddingDisplayCost", () => {
	it("computes cost for OpenAI text-embedding-3-small", async () => {
		const cost = await calculateEmbeddingDisplayCost(
			"openai",
			"text-embedding-3-small",
			{ tokens: 1000 },
		);
		// $0.01 per 1M tokens => 1000 tokens = $0.00001
		expect(cost.totalCostForDisplay).toBeCloseTo(0.00001, 10);
	});

	it("computes cost for OpenAI text-embedding-3-large", async () => {
		const cost = await calculateEmbeddingDisplayCost(
			"openai",
			"text-embedding-3-large",
			{ tokens: 2000 },
		);
		// $0.065 per 1M tokens => 2000 tokens = $0.00013
		expect(cost.totalCostForDisplay).toBeCloseTo(0.00013, 10);
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

	it("computes cost for Cohere embed-4", async () => {
		const cost = await calculateEmbeddingDisplayCost("cohere", "embed-4", {
			tokens: 1000,
		});
		// $0.12 per 1M tokens => 1000 tokens = $0.00012
		expect(cost.totalCostForDisplay).toBeCloseTo(0.00012, 10);
	});
});
