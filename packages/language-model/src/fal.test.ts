import { describe, expect, test } from "vitest";
import { getImageGenerationModelProvider } from "./fal";

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
