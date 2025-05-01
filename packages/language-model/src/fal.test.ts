import { describe, expect, test } from "vitest";
import {calculateFalCost, calculateMegaPixels, getImageGenerationModelProvider, models,} from "./fal";

describe("getImageGenerationModelProvider", () => {
	test("should identify flux provider", () => {
		const provider = getImageGenerationModelProvider("fal-ai/flux/schnell");
		expect(provider).toBe("flux");
	});

	test("should identify flux-pro provider", () => {
		const provider = getImageGenerationModelProvider("fal-ai/flux-pro/v1.1");
		expect(provider).toBe("flux");
	});

	test("should identify recraft provider", () => {
		const provider = getImageGenerationModelProvider("fal-ai/recraft-20b");
		expect(provider).toBe("recraft");
	});

	test("should identify recraft v3 provider", () => {
		const provider = getImageGenerationModelProvider("fal-ai/recraft-v3");
		expect(provider).toBe("recraft");
	});

	test("should identify ideogram provider", () => {
		const provider = getImageGenerationModelProvider(
			"fal-ai/ideogram/v2/turbo",
		);
		expect(provider).toBe("ideogram");
	});

	test("should identify stable-diffusion provider", () => {
		const provider = getImageGenerationModelProvider(
			"fal-ai/stable-diffusion-3.5-medium",
		);
		expect(provider).toBe("stable-diffusion");
	});

	test("should return undefined for unknown provider", () => {
		const provider = getImageGenerationModelProvider("fal-ai/unknown-model");
		expect(provider).toBeUndefined();
	});

	test("should return undefined for malformed input", () => {
		const provider = getImageGenerationModelProvider("invalid-format");
		expect(provider).toBeUndefined();
	});
});

describe("calculateFalCost", () => {
	describe("count based pricing", () => {
		const countBasedPrice = {
			type: "count" as const,
			pricePerImage: 0.035,
		};

		test("calculates cost based on number of images", () => {
			const usage: ImageUsage = { nOfImages: 3 };
			expect(calculateFalCost(usage, countBasedPrice)).toBeCloseTo(0.105, 5);
		});

		test("returns 0 for invalid usage type", () => {
			const usage: ImageUsage = { pixelDimensions: "512x512" };
			expect(calculateFalCost(usage, countBasedPrice)).toBe(0);
		});
	});

	describe("size based pricing", () => {
		const sizeBasedPrice = {
			type: "size" as const,
			pricePerMegaPixel: 0.05,
		};

		test("calculates cost based on pixel dimensions", () => {
			const usage: ImageUsage = { pixelDimensions: "512x512" };
			const expectedMegaPixels = calculateMegaPixels("512x512");
			expect(calculateFalCost(usage, sizeBasedPrice)).toBeCloseTo(0.05, 5);
		});

		test("returns 0 for invalid usage type", () => {
			const usage: ImageUsage = { nOfImages: 2 };
			expect(calculateFalCost(usage, sizeBasedPrice)).toBe(0);
		});
	});

	describe("edge cases", () => {
		const sizeBasedPrice = {
			type: "size" as const,
			pricePerMegaPixel: 0.05,
		};

		test("handles large image sizes correctly", () => {
			const usage: ImageUsage = { pixelDimensions: "1024x1024" };
			const expectedMegaPixels = calculateMegaPixels("1024x1024");
			expect(calculateFalCost(usage, sizeBasedPrice)).toBeCloseTo(0.1, 5);
		});

		test("handles various dimension formats", () => {
			const usage1: ImageUsage = { pixelDimensions: "1152x864" };
			const usage2: ImageUsage = { pixelDimensions: "1312x736" };

			expect(calculateFalCost(usage1, sizeBasedPrice)).toBeCloseTo(0.05, 5);
			expect(calculateFalCost(usage2, sizeBasedPrice)).toBeCloseTo(0.05, 5);
		});
	});
});
