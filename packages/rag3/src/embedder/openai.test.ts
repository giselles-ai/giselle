import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmbeddingError } from "../errors";
import { OpenAIEmbedder } from "./openai";

// グローバルのfetchをモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("OpenAIEmbedder", () => {
	let embedder: OpenAIEmbedder;

	beforeEach(() => {
		vi.clearAllMocks();
		embedder = new OpenAIEmbedder({ apiKey: "test-api-key" });
	});

	it("should generate embeddings for single text", async () => {
		const mockResponse = {
			ok: true,
			json: async () => ({
				data: [{ embedding: [0.1, 0.2, 0.3] }],
			}),
		};
		mockFetch.mockResolvedValueOnce(mockResponse);

		const result = await embedder.embed("test text");

		expect(result).toEqual([0.1, 0.2, 0.3]);
		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.openai.com/v1/embeddings",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					Authorization: "Bearer test-api-key",
				}),
			}),
		);
	});

	it("should generate embeddings for multiple texts", async () => {
		const mockResponse = {
			ok: true,
			json: async () => ({
				data: [{ embedding: [0.1, 0.2, 0.3] }, { embedding: [0.4, 0.5, 0.6] }],
			}),
		};
		mockFetch.mockResolvedValueOnce(mockResponse);

		const result = await embedder.embedBatch(["text1", "text2"]);

		expect(result).toEqual([
			[0.1, 0.2, 0.3],
			[0.4, 0.5, 0.6],
		]);
	});

	it("should handle empty input", async () => {
		const result = await embedder.embedBatch([]);

		expect(result).toEqual([]);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("should throw EmbeddingError on API failure", async () => {
		const mockResponse = {
			ok: false,
			status: 400,
			text: async () => "Bad Request",
		};
		mockFetch.mockResolvedValueOnce(mockResponse);

		await expect(embedder.embed("test")).rejects.toThrow(EmbeddingError);
	});

	it("should retry on failure", async () => {
		const failResponse = {
			ok: false,
			status: 500,
			text: async () => "Server Error",
		};
		const successResponse = {
			ok: true,
			json: async () => ({ data: [{ embedding: [0.1, 0.2, 0.3] }] }),
		};

		mockFetch
			.mockResolvedValueOnce(failResponse)
			.mockResolvedValueOnce(successResponse);

		const result = await embedder.embed("test");

		expect(result).toEqual([0.1, 0.2, 0.3]);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});
});
