import { EMBEDDING_PROFILES } from "@giselles-ai/protocol";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createGatewayEmbedder,
	isGatewaySupportedEmbeddingProfile,
} from "./gateway";
import { createGoogleEmbedder } from "./google";
import { createOpenAIEmbedder } from "./openai";
import { createEmbedderFromProfile } from "./profiles";

vi.mock("./openai", () => ({
	createOpenAIEmbedder: vi.fn(() => "openai-embedder"),
}));

vi.mock("./google", () => ({
	createGoogleEmbedder: vi.fn(() => "google-embedder"),
}));

vi.mock("./not-implemented", () => ({
	createNotImplementedEmbedder: vi.fn(() => "not-implemented-embedder"),
}));

vi.mock("./gateway", async () => {
	const actual = await vi.importActual<typeof import("./gateway")>("./gateway");
	return {
		...actual,
		createGatewayEmbedder: vi.fn(() => "gateway-embedder"),
	};
});

describe("createEmbedderFromProfile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("uses the OpenAI embedder when no transport is provided", () => {
		const result = createEmbedderFromProfile(1, "openai-key");

		expect(createOpenAIEmbedder).toHaveBeenCalledWith(
			expect.objectContaining({
				apiKey: "openai-key",
				transport: "provider",
			}),
		);
		expect(result).toBe("openai-embedder");
	});

	it("uses the Google embedder for Gemini profiles", () => {
		const result = createEmbedderFromProfile(3, "google-key");

		expect(createGoogleEmbedder).toHaveBeenCalledWith(
			expect.objectContaining({
				apiKey: "google-key",
				transport: "provider",
			}),
		);
		expect(result).toBe("google-embedder");
	});

	it("uses the gateway embedder when transport is set to gateway", () => {
		const result = createEmbedderFromProfile(1, "gateway-key", {
			transport: "gateway",
		});

		expect(createGatewayEmbedder).toHaveBeenCalledWith(
			expect.objectContaining({
				apiKey: "gateway-key",
				transport: "gateway",
			}),
		);
		expect(result).toBe("gateway-embedder");
	});

	it("throws if transport gateway is requested for an unsupported profile", () => {
		expect(() =>
			createEmbedderFromProfile(4, "gateway-key", {
				transport: "gateway",
			}),
		).toThrow(
			"Embedding profile '4' (cohere/embed-4) is not supported by AI Gateway",
		);
	});
});

describe("isGatewaySupportedEmbeddingProfile", () => {
	it("returns true for supported OpenAI profiles", () => {
		expect(
			isGatewaySupportedEmbeddingProfile(EMBEDDING_PROFILES[1]),
		).toBeTruthy();
		expect(
			isGatewaySupportedEmbeddingProfile(EMBEDDING_PROFILES[2]),
		).toBeTruthy();
	});

	it("returns false for unsupported providers", () => {
		expect(isGatewaySupportedEmbeddingProfile(EMBEDDING_PROFILES[4])).toBe(
			false,
		);
	});
});
