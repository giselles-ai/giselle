import { parseAndMod } from "@giselle-sdk/data-mod";
import type { GenerationId, GenerationIndex } from "@giselle-sdk/data-type";
import { createStorage } from "unstorage";
import memoryDriver from "unstorage/drivers/memory";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getGeneration, setGenerationIndex } from "./utils";

// Mock parseAndMod to track when it's called
vi.mock("@giselle-sdk/data-mod", () => ({
	parseAndMod: vi.fn((schema, data) => {
		return schema.parse(data);
	}),
}));

describe("getGeneration", () => {
	const storage = createStorage({ driver: memoryDriver() });
	const generationId: GenerationId = "gnr-1234567890abcdef";

	const mockGenerationIndex: GenerationIndex = {
		id: generationId,
		origin: {
			type: "workspace",
			id: "wrks-1234567890abcdef",
		},
	};

	const mockGeneration = {
		id: generationId,
		status: "completed" as const,
		context: {
			origin: {
				type: "workspace" as const,
				id: "wrks-1234567890abcdef",
			},
			operationNode: {
				id: "nd-1234567890abcdef",
				type: "operation" as const,
				inputs: [],
				outputs: [],
				content: {
					type: "textGeneration" as const,
					llm: {
						provider: "openai" as const,
						id: "gpt-4",
						configurations: {
							temperature: 0.7,
							topP: 1.0,
							presencePenalty: 0.0,
							frequencyPenalty: 0.0,
						},
					},
				},
			},
			connections: [],
			sourceNodes: [],
		},
		messages: [],
		outputs: [],
		createdAt: Date.now(),
		queuedAt: Date.now(),
		startedAt: Date.now(),
		completedAt: Date.now(),
	};

	beforeEach(async () => {
		await storage.clear();
		vi.mocked(parseAndMod).mockClear();

		// Set up generation index
		await setGenerationIndex({
			storage,
			generationIndex: mockGenerationIndex,
		});

		// Set up generation data
		const generationPath = `generations/${generationId}/generation.json`;
		await storage.setItem(generationPath, mockGeneration);
	});

	test("should use parseAndMod when skipMod is false", async () => {
		const result = await getGeneration({
			storage,
			generationId,
			options: { skipMod: false },
		});

		expect(result).toBeDefined();
		expect(vi.mocked(parseAndMod)).toHaveBeenCalledTimes(2); // Called for Generation and GenerationContext
		expect(result?.id).toBe(generationId);
		expect(result?.status).toBe("completed");
	});

	test("should use parseAndMod when skipMod is undefined", async () => {
		const result = await getGeneration({
			storage,
			generationId,
		});

		expect(result).toBeDefined();
		expect(vi.mocked(parseAndMod)).toHaveBeenCalledTimes(2); // Called for Generation and GenerationContext
		expect(result?.id).toBe(generationId);
		expect(result?.status).toBe("completed");
	});

	test("should use regular parse when skipMod is true", async () => {
		const result = await getGeneration({
			storage,
			generationId,
			options: { skipMod: true },
		});

		expect(result).toBeDefined();
		expect(vi.mocked(parseAndMod)).not.toHaveBeenCalled(); // parseAndMod should not be called when skipMod is true
		expect(result?.id).toBe(generationId);
		expect(result?.status).toBe("completed");
	});

	test("should throw error when generation index not found", async () => {
		const nonExistentId: GenerationId = "gnr-nonexistent1234";

		await expect(
			getGeneration({
				storage,
				generationId: nonExistentId,
			}),
		).rejects.toThrow("Generation not found");
	});

	test("should respect bypassingCache option", async () => {
		const result = await getGeneration({
			storage,
			generationId,
			options: { bypassingCache: true, skipMod: true },
		});

		expect(result).toBeDefined();
		expect(result?.id).toBe(generationId);
	});
});
