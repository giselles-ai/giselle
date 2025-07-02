import { describe, expect, it } from "vitest";
import { getValidPricing, type ModelPriceTable } from "./model-prices";

describe("getValidPricing", () => {
	it("should return the price", () => {
		const now = new Date();
		const past = new Date(now.getTime() - 1000);

		const priceTable: ModelPriceTable = {
			"test-model": {
				prices: [
					{
						validFrom: past.toISOString(),
						price: {
							input: { costPerMegaToken: 1 },
							output: { costPerMegaToken: 2 },
						},
					},
				],
			},
		};

		const result = getValidPricing("test-model", priceTable);
		expect(result.price.input.costPerMegaToken).toBe(1);
		expect(result.price.output.costPerMegaToken).toBe(2);
	});
	it("should return the most recent valid price", () => {
		const now = new Date();
		const past = new Date(now.getTime() - 1000);
		const future = new Date(Date.now() + 1000);

		const priceTable: ModelPriceTable = {
			"test-model": {
				prices: [
					{
						validFrom: past.toISOString(),
						price: {
							input: { costPerMegaToken: 1 },
							output: { costPerMegaToken: 2 },
						},
					},
					{
						validFrom: now.toISOString(),
						price: {
							input: { costPerMegaToken: 3 },
							output: { costPerMegaToken: 4 },
						},
					},
					{
						validFrom: future.toISOString(),
						price: {
							input: { costPerMegaToken: 5 },
							output: { costPerMegaToken: 6 },
						},
					},
				],
			},
		};

		const result = getValidPricing("test-model", priceTable);
		expect(result.price.input.costPerMegaToken).toBe(3);
		expect(result.price.output.costPerMegaToken).toBe(4);
	});

	it("should throw an error when model is not found", () => {
		const priceTable: ModelPriceTable = {};

		expect(() => getValidPricing("non-existent-model", priceTable)).toThrow(
			"No pricing found for model non-existent-model",
		);
	});

	it("should throw an error when no valid prices are found", () => {
		const future = new Date(Date.now() + 1000);
		const priceTable: ModelPriceTable = {
			"test-model": {
				prices: [
					{
						validFrom: future.toISOString(),
						price: {
							input: { costPerMegaToken: 1 },
							output: { costPerMegaToken: 2 },
						},
					},
				],
			},
		};

		expect(() => getValidPricing("test-model", priceTable)).toThrow(
			"No valid pricing found for model test-model",
		);
	});

	it("should return the most recent price when multiple valid prices exist", () => {
		const now = new Date();
		const initial = new Date(now.getTime() - 2000);
		const updated = new Date(now.getTime() - 1000);

		const priceTable: ModelPriceTable = {
			"test-model": {
				prices: [
					{
						validFrom: initial.toISOString(),
						price: {
							input: { costPerMegaToken: 1 },
							output: { costPerMegaToken: 2 },
						},
					},
					{
						validFrom: updated.toISOString(),
						price: {
							input: { costPerMegaToken: 3 },
							output: { costPerMegaToken: 4 },
						},
					},
				],
			},
		};

		const result = getValidPricing("test-model", priceTable);
		expect(result.price.input.costPerMegaToken).toBe(3);
		expect(result.price.output.costPerMegaToken).toBe(4);
	});
});
