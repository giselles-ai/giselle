import { describe, expect, it } from "vitest";
import type { ZodIssue } from "zod";
import { addUsageToGeneration } from "./add-usage-to-generation";

describe("addUsageToGeneration", () => {
	it("should add usage field to a completed generation", () => {
		const data = {
			id: "gnr-123456",
			context: { origin: { type: "workspace", id: "wrks-123456" } },
			status: "completed",
			createdAt: 1643000000000,
			queuedAt: 1643000001000,
			startedAt: 1643000002000,
			completedAt: 1643000003000,
			messages: [
				{ role: "user", content: "Hello" },
				{ role: "assistant", content: "Hi there!" },
			],
			outputs: [{ type: "text", content: "Hi there!" }],
		};

		const issue: ZodIssue = {
			code: "invalid_type",
			expected: "object",
			received: "undefined",
			path: ["usage"],
			message: "Required",
		};

		const result = addUsageToGeneration(data, issue);

		expect(result).toEqual({
			...data,
			usage: {
				promptTokens: 200,
				completionTokens: 400,
				totalTokens: 600,
			},
		});
	});

	it("should add usage field to a running generation", () => {
		const data = {
			id: "gnr-123456",
			context: { origin: { type: "workspace", id: "wrks-123456" } },
			status: "running",
			createdAt: 1643000000000,
			queuedAt: 1643000001000,
			startedAt: 1643000002000,
			messages: [{ role: "user", content: "Hello" }],
		};

		const issue: ZodIssue = {
			code: "invalid_type",
			expected: "object",
			received: "undefined",
			path: ["usage"],
			message: "Required",
		};

		const result = addUsageToGeneration(data, issue);

		expect(result).toEqual({
			...data,
			usage: {
				promptTokens: 100,
				completionTokens: 100,
				totalTokens: 200,
			},
		});
	});

	it("should add empty usage for a queued generation", () => {
		const data = {
			id: "gnr-123456",
			context: { origin: { type: "workspace", id: "wrks-123456" } },
			status: "queued",
			createdAt: 1643000000000,
			queuedAt: 1643000001000,
		};

		const issue: ZodIssue = {
			code: "invalid_type",
			expected: "object",
			received: "undefined",
			path: ["usage"],
			message: "Required",
		};

		const result = addUsageToGeneration(data, issue);

		expect(result).toEqual({
			...data,
			usage: {
				promptTokens: 0,
				completionTokens: 0,
				totalTokens: 0,
			},
		});
	});

	it("should not modify data when issue is not related to usage", () => {
		const data = {
			id: "gnr-123456",
			context: { origin: { type: "workspace", id: "wrks-123456" } },
			status: "completed",
		};

		const issue: ZodIssue = {
			code: "invalid_type",
			expected: "string",
			received: "undefined",
			path: ["someOtherField"],
			message: "Required",
		};

		const result = addUsageToGeneration(data, issue);

		expect(result).toBe(data);
	});

	it("should handle non-object data", () => {
		const data = "not an object";

		const issue: ZodIssue = {
			code: "invalid_type",
			expected: "object",
			received: "undefined",
			path: ["usage"],
			message: "Required",
		};

		const result = addUsageToGeneration(data, issue);

		expect(result).toBe(data);
	});
});
