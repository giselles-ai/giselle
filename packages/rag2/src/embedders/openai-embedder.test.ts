import { beforeEach, describe, expect, it, vi } from "vitest";
import { OpenAIEmbedder, createOpenAIEmbedder } from "./openai-embedder";

// Mock OpenAI
vi.mock("openai", () => {
	return {
		default: vi.fn().mockImplementation(() => ({
			embeddings: {
				create: vi.fn().mockResolvedValue({
					data: [{ embedding: [0.1, 0.2, 0.3] }],
				}),
			},
		})),
	};
});

describe("OpenAIEmbedder", () => {
	// biome-ignore lint/suspicious/noExplicitAny: Test mock object
	let mockOpenAI: any;

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks();

		mockOpenAI = {
			embeddings: {
				create: vi.fn().mockResolvedValue({
					data: [{ embedding: [0.1, 0.2, 0.3] }],
				}),
			},
		};
	});

	it("should embed text using OpenAI API", async () => {
		const embedder = new OpenAIEmbedder(mockOpenAI);
		const text = "Test text to embed";

		const result = await embedder.embed(text);

		expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
			model: "text-embedding-3-small",
			input: text,
		});
		expect(result).toEqual([0.1, 0.2, 0.3]);
	});

	describe("createOpenAIEmbedder", () => {
		beforeEach(() => {
			// Clear environment variable
			// biome-ignore lint/performance/noDelete: Test cleanup requires delete
			delete process.env.OPENAI_API_KEY;
		});

		it("should throw error when OPENAI_API_KEY is not set", () => {
			expect(() => createOpenAIEmbedder()).toThrow(
				"Required environment variable 'OPENAI_API_KEY' is not set",
			);
		});

		it("should create embedder when OPENAI_API_KEY is set", () => {
			process.env.OPENAI_API_KEY = "test-key";

			const embedder = createOpenAIEmbedder();

			expect(embedder).toBeInstanceOf(OpenAIEmbedder);
		});
	});
});
