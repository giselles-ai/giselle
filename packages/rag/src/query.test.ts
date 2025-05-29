import { describe, expect, it, vi } from "vitest";
import { query } from "./query";
import type { QueryFunction, QueryMetadataType, RecordValue } from "./types";

// Mock the OpenAIEmbedder
vi.mock("./embed", () => ({
	OpenAIEmbedder: vi.fn().mockImplementation(() => ({
		embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
	})),
}));

describe("query function", () => {
	const mockQueryFunction: QueryFunction<QueryMetadataType> = vi
		.fn()
		.mockResolvedValue([
			{
				chunk: { content: "test content", index: 0 },
				score: 0.9,
				metadata: { source: "test" },
			},
		]);

	const validParams = {
		question: "What is the meaning of life?",
		limit: 10,
		filters: { workspaceId: "test-workspace" },
		queryFunction: mockQueryFunction,
	};

	it("should validate question parameter", async () => {
		// Test empty string
		await expect(
			query({
				...validParams,
				question: "",
			}),
		).rejects.toThrow("Question must be a non-empty string");

		// Test whitespace only
		await expect(
			query({
				...validParams,
				question: "   ",
			}),
		).rejects.toThrow("Question must be a non-empty string");

		// Test null
		await expect(
			query({
				...validParams,
				question: null as any,
			}),
		).rejects.toThrow("Question must be a non-empty string");

		// Test undefined
		await expect(
			query({
				...validParams,
				question: undefined as any,
			}),
		).rejects.toThrow("Question must be a non-empty string");

		// Test non-string
		await expect(
			query({
				...validParams,
				question: 123 as any,
			}),
		).rejects.toThrow("Question must be a non-empty string");
	});

	it("should validate limit parameter", async () => {
		// Test zero
		await expect(
			query({
				...validParams,
				limit: 0,
			}),
		).rejects.toThrow("Limit must be a positive integer");

		// Test negative
		await expect(
			query({
				...validParams,
				limit: -1,
			}),
		).rejects.toThrow("Limit must be a positive integer");

		// Test float
		await expect(
			query({
				...validParams,
				limit: 1.5,
			}),
		).rejects.toThrow("Limit must be a positive integer");

		// Test non-number
		await expect(
			query({
				...validParams,
				limit: "10" as any,
			}),
		).rejects.toThrow("Limit must be a positive integer");
	});

	it("should validate queryFunction parameter", async () => {
		await expect(
			query({
				...validParams,
				queryFunction: null as any,
			}),
		).rejects.toThrow("Query function must be provided");

		await expect(
			query({
				...validParams,
				queryFunction: "not a function" as any,
			}),
		).rejects.toThrow("Query function must be provided");
	});

	it("should handle query function execution errors", async () => {
		const errorQueryFunction = vi
			.fn()
			.mockRejectedValue(new Error("Database connection failed"));

		await expect(
			query({
				...validParams,
				queryFunction: errorQueryFunction,
			}),
		).rejects.toThrow("Query function execution failed: Database connection failed");
	});

	it("should successfully execute query with valid parameters", async () => {
		const result = await query(validParams);

		expect(result).toEqual([
			{
				chunk: { content: "test content", index: 0 },
				score: 0.9,
				metadata: { source: "test" },
			},
		]);

		expect(mockQueryFunction).toHaveBeenCalledWith({
			embedding: [0.1, 0.2, 0.3],
			limit: 10,
			filters: { workspaceId: "test-workspace" },
			similarityThreshold: 0.5,
		});
	});
});