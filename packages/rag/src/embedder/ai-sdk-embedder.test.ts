import { type EmbeddingModel, embed, embedMany } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAiSdkEmbedder } from "./ai-sdk-embedder";

vi.mock("ai", () => ({
	embed: vi.fn(),
	embedMany: vi.fn(),
}));

describe("createAiSdkEmbedder", () => {
	const mockGetModel = vi.fn((modelName: string) => ({
		modelId: modelName,
	})) as unknown as (modelName: string) => EmbeddingModel<string>;

	const mockProfile = {
		provider: "openai" as const,
		model: "text-embedding-3-small",
		dimensions: 1536,
		name: "Test Profile",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should call embeddingComplete callback after embed", async () => {
		const mockEmbedding = [0.1, 0.2, 0.3];
		const mockUsage = { tokens: 10 };
		const embeddingCompleteCallback = vi.fn();

		// biome-ignore lint/suspicious/noExplicitAny: mock
		(embed as any).mockResolvedValue({
			embedding: mockEmbedding,
			usage: mockUsage,
		});

		const embedder = createAiSdkEmbedder(
			{
				apiKey: "test-api-key",
				profile: mockProfile,
				embeddingComplete: embeddingCompleteCallback,
			},
			mockGetModel,
		);

		const result = await embedder.embed("test text");

		expect(result).toEqual(mockEmbedding);
		expect(embeddingCompleteCallback).toHaveBeenCalledWith(
			expect.objectContaining({
				texts: ["test text"],
				embeddings: [mockEmbedding],
				model: "text-embedding-3-small",
				provider: "openai",
				dimensions: 1536,
				usage: { tokens: 10 },
				operation: "embed",
				startTime: expect.any(Date),
				endTime: expect.any(Date),
			}),
		);
	});

	it("should include image token usage when provided", async () => {
		const mockEmbedding = [0.1, 0.2, 0.3];
		const mockUsage = { tokens: 10, imageTokens: 5 };
		const embeddingCompleteCallback = vi.fn();

		// biome-ignore lint/suspicious/noExplicitAny: mock
		(embed as any).mockResolvedValue({
			embedding: mockEmbedding,
			usage: mockUsage,
		});

		const embedder = createAiSdkEmbedder(
			{
				apiKey: "test-api-key",
				profile: mockProfile,
				embeddingComplete: embeddingCompleteCallback,
			},
			mockGetModel,
		);

		await embedder.embed("test text");

		expect(embeddingCompleteCallback).toHaveBeenCalledWith(
			expect.objectContaining({
				usage: { tokens: 10, imageTokens: 5 },
			}),
		);
	});

	it("should retain image-only usage", async () => {
		const mockEmbedding = [0.1, 0.2, 0.3];
		const mockUsage = { imageTokens: 7 };
		const embeddingCompleteCallback = vi.fn();

		// biome-ignore lint/suspicious/noExplicitAny: mock
		(embed as any).mockResolvedValue({
			embedding: mockEmbedding,
			usage: mockUsage,
		});

		const embedder = createAiSdkEmbedder(
			{
				apiKey: "test-api-key",
				profile: mockProfile,
				embeddingComplete: embeddingCompleteCallback,
			},
			mockGetModel,
		);

		await embedder.embed("image input");

		expect(embeddingCompleteCallback).toHaveBeenCalledWith(
			expect.objectContaining({
				usage: { tokens: 0, imageTokens: 7 },
			}),
		);
	});

	it("should preserve zero-token text usage", async () => {
		const mockEmbedding = [0.1, 0.2, 0.3];
		const mockUsage = { tokens: 0 };
		const embeddingCompleteCallback = vi.fn();

		// biome-ignore lint/suspicious/noExplicitAny: mock
		(embed as any).mockResolvedValue({
			embedding: mockEmbedding,
			usage: mockUsage,
		});

		const embedder = createAiSdkEmbedder(
			{
				apiKey: "test-api-key",
				profile: mockProfile,
				embeddingComplete: embeddingCompleteCallback,
			},
			mockGetModel,
		);

		await embedder.embed("");

		expect(embeddingCompleteCallback).toHaveBeenCalledWith(
			expect.objectContaining({
				usage: { tokens: 0 },
			}),
		);
	});

	it("should call embeddingComplete callback after embedMany", async () => {
		const mockEmbeddings = [
			[0.1, 0.2, 0.3],
			[0.4, 0.5, 0.6],
		];
		const mockUsage = { tokens: 20 };
		const embeddingCompleteCallback = vi.fn();

		// biome-ignore lint/suspicious/noExplicitAny: mock
		(embedMany as any).mockResolvedValue({
			embeddings: mockEmbeddings,
			usage: mockUsage,
		});

		const embedder = createAiSdkEmbedder(
			{
				apiKey: "test-api-key",
				profile: mockProfile,
				embeddingComplete: embeddingCompleteCallback,
			},
			mockGetModel,
		);

		const texts = ["text 1", "text 2"];
		const result = await embedder.embedMany(texts);

		expect(result).toEqual(mockEmbeddings);
		expect(embeddingCompleteCallback).toHaveBeenCalledWith(
			expect.objectContaining({
				texts,
				embeddings: mockEmbeddings,
				model: "text-embedding-3-small",
				provider: "openai",
				dimensions: 1536,
				usage: { tokens: 20 },
				operation: "embedMany",
				startTime: expect.any(Date),
				endTime: expect.any(Date),
			}),
		);
	});

	it("should handle missing usage data", async () => {
		const mockEmbedding = [0.1, 0.2, 0.3];
		const embeddingCompleteCallback = vi.fn();

		// biome-ignore lint/suspicious/noExplicitAny: mock
		(embed as any).mockResolvedValue({
			embedding: mockEmbedding,
			usage: undefined,
		});

		const embedder = createAiSdkEmbedder(
			{
				apiKey: "test-api-key",
				profile: mockProfile,
				embeddingComplete: embeddingCompleteCallback,
			},
			mockGetModel,
		);

		await embedder.embed("test text");

		expect(embeddingCompleteCallback).toHaveBeenCalledWith(
			expect.objectContaining({
				texts: ["test text"],
				embeddings: [mockEmbedding],
				model: "text-embedding-3-small",
				provider: "openai",
				dimensions: 1536,
				usage: undefined,
				operation: "embed",
				startTime: expect.any(Date),
				endTime: expect.any(Date),
			}),
		);
	});

	it("should not throw if embeddingComplete callback throws", async () => {
		const mockEmbedding = [0.1, 0.2, 0.3];
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const embeddingCompleteCallback = vi
			.fn()
			.mockRejectedValue(new Error("Callback error"));

		// biome-ignore lint/suspicious/noExplicitAny: mock
		(embed as any).mockResolvedValue({
			embedding: mockEmbedding,
			usage: { tokens: 10 },
		});

		const embedder = createAiSdkEmbedder(
			{
				apiKey: "test-api-key",
				profile: mockProfile,
				embeddingComplete: embeddingCompleteCallback,
			},
			mockGetModel,
		);

		const result = await embedder.embed("test text");

		expect(result).toEqual(mockEmbedding);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Embedding callback error:",
			expect.any(Error),
		);
	});

	it("should work without embeddingComplete callback", async () => {
		const mockEmbedding = [0.1, 0.2, 0.3];

		// biome-ignore lint/suspicious/noExplicitAny: mock
		(embed as any).mockResolvedValue({
			embedding: mockEmbedding,
			usage: { tokens: 10 },
		});

		const embedder = createAiSdkEmbedder(
			{
				apiKey: "test-api-key",
				profile: mockProfile,
			},
			mockGetModel,
		);

		const result = await embedder.embed("test text");

		expect(result).toEqual(mockEmbedding);
	});

	it("should expose embeddingComplete callback on the embedder", () => {
		const embeddingCompleteCallback = vi.fn();

		const embedder = createAiSdkEmbedder(
			{
				apiKey: "test-api-key",
				profile: mockProfile,
				embeddingComplete: embeddingCompleteCallback,
			},
			mockGetModel,
		);

		expect(embedder.embeddingComplete).toBe(embeddingCompleteCallback);
	});
});
