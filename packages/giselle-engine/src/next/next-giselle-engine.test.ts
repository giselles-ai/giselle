import { createStorage } from "unstorage";
import memoryDriver from "unstorage/drivers/memory";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GiselleEngine } from "../core";
import { createHttpHandler } from "./next-giselle-engine";

// Mock the module dependencies
vi.mock("../http", () => {
	const mockJsonHandler = vi.fn().mockResolvedValue({ success: true });

	return {
		isJsonRouterPath: (path: string) => path === "testRoute",
		isFormDataRouterPath: () => false,
		createJsonRouters: {
			testRoute: () => mockJsonHandler,
		},
		createFormDataRouters: {},
	};
});

const memoryStorage = createStorage({
	driver: memoryDriver(),
});

describe("createHttpHandler", () => {
	const mockFile = new File(["test image content"], "test.png", {
		type: "image/png",
	});
	const mockGiselleEngine = {
		getGeneratedImage: vi.fn().mockResolvedValue(mockFile),
	} as unknown as GiselleEngine;
	const basePath = "/api/giselle";
	let httpHandler: (request: Request) => Promise<Response>;

	beforeEach(() => {
		vi.clearAllMocks();
		httpHandler = createHttpHandler({
			giselleEngine: mockGiselleEngine,
			config: {
				basePath,
				storage: memoryStorage,
			},
		});
	});

	it("should correctly parse URL segments", async () => {
		// Test valid URL
		const validRequest = new Request(
			`https://example.com${basePath}/testRoute`,
			{
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({ test: "data" }),
			},
		);

		const result = await httpHandler(validRequest);
		expect(result).toEqual({ success: true });
	});

	it("should throw error for invalid base path", async () => {
		// Test URL with invalid base path
		const invalidBasePathRequest = new Request(
			"https://example.com/invalid/testRoute",
			{
				method: "POST",
			},
		);

		await expect(httpHandler(invalidBasePathRequest)).rejects.toThrow(
			/Cannot parse action at/,
		);
	});

	it("should throw error for multiple segments", async () => {
		// Test URL with multiple segments
		const multiSegmentRequest = new Request(
			`https://example.com${basePath}/testRoute/extra`,
			{
				method: "POST",
			},
		);

		await expect(httpHandler(multiSegmentRequest)).rejects.toThrow(
			/Invalid action at/,
		);
	});

	it("should throw error for invalid router path", async () => {
		// Test URL with invalid router path
		const invalidRouterRequest = new Request(
			`https://example.com${basePath}/invalidRoute`,
			{
				method: "POST",
			},
		);

		await expect(httpHandler(invalidRouterRequest)).rejects.toThrow(
			/Invalid router path at/,
		);
	});

	it("should handle generated image multi-segment path", async () => {
		const generationId = "gnr-1234567890abcdef";
		const filename = "image.png";
		const imageRequest = new Request(
			`https://example.com${basePath}/generations/${generationId}/generated-images/${filename}`,
			{ method: "GET" },
		);

		const response = await httpHandler(imageRequest);

		expect(mockGiselleEngine.getGeneratedImage).toHaveBeenCalledWith(
			generationId,
			filename,
		);
		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get("Content-Type")).toBe("image/png");
		expect(response.headers.get("Content-Disposition")).toBe(
			`inline; filename="test.png"`,
		);

		const responseBody = await response.blob();
		expect(responseBody.type).toBe("image/png");
	});
});
