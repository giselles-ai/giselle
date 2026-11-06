import type { fetch } from "undici";
import { describe, expect, it, vi } from "vitest";
import { scrapeUrl } from "./self-made";

const TEST_UPPERCASE_TXT_URL = "https://example.com/TEST.TXT";
const TEST_UPPERCASE_MD_URL = "https://example.com/README.MD";

let mockFetch: typeof fetch;
vi.mock("undici", async (importOriginal) => {
	const actual = await importOriginal<typeof import("undici")>();
	return {
		...actual,
		fetch: (...args: Parameters<typeof fetch>) => mockFetch(...args),
	};
});

describe("scrapeUrl (invalid URL)", () => {
	it("should throw on invalid URL", async () => {
		await expect(scrapeUrl("not-a-url")).rejects.toThrow();
	});
});

describe("scrapeUrl (edge cases with mocks)", () => {
	it("should handle uppercase .TXT file extensions", async () => {
		const mockContent = "# Test Content\nThis is a test markdown file.";

		const mockHeaders = {
			get: (name: string) => (name === "content-type" ? "text/plain" : null),
		};
		mockFetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: mockHeaders,
			text: () => Promise.resolve(mockContent),
		});

		const result = await scrapeUrl(TEST_UPPERCASE_TXT_URL, ["markdown"]);

		expect(result.title).toBe("TEST.TXT");
		expect(result.markdown).toBe(mockContent);
		expect(result.markdown).not.toContain("\\#"); // Should not be escaped
	});

	it("should handle uppercase .MD file extensions", async () => {
		const mockContent = "**Bold** and *italic* text with https://example.com";

		const mockHeaders = {
			get: (name: string) => (name === "content-type" ? "text/plain" : null),
		};
		mockFetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: mockHeaders,
			text: () => Promise.resolve(mockContent),
		});

		const result = await scrapeUrl(TEST_UPPERCASE_MD_URL, ["markdown"]);

		expect(result.title).toBe("README.MD");
		expect(result.markdown).toBe(mockContent);
		expect(result.markdown).not.toContain("\\*\\*"); // Should not be escaped
		expect(result.markdown).not.toContain("\\/"); // URLs should not be escaped
	});

	it("should handle different markdown content-types", async () => {
		const mockContent = "**Bold text** and [link](https://example.com)";

		const mockHeaders = {
			get: (name: string) =>
				name === "content-type" ? "text/x-markdown; charset=utf-8" : null,
		};
		mockFetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: mockHeaders,
			text: () => Promise.resolve(mockContent),
		});

		const result = await scrapeUrl("https://example.com/test.unknown", [
			"markdown",
		]);

		expect(result.markdown).toBe(mockContent);
		expect(result.markdown).not.toContain("\\*\\*"); // Should not be escaped
		expect(result.markdown).not.toContain("\\/"); // URLs should not be escaped
	});

	it("should handle application/markdown content-type", async () => {
		const mockContent = "# Header\n\nSome content with https://example.com/url";

		const mockHeaders = {
			get: (name: string) =>
				name === "content-type" ? "application/markdown" : null,
		};
		mockFetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: mockHeaders,
			text: () => Promise.resolve(mockContent),
		});

		const result = await scrapeUrl("https://example.com/doc", ["markdown"]);

		expect(result.markdown).toBe(mockContent);
		expect(result.markdown).toContain("https://example.com/url");
		expect(result.markdown).not.toContain("\\#");
	});
});

describe("scrapeUrl (redirect SSRF protection)", () => {
	it("should block redirects to private IP addresses", async () => {
		mockFetch = vi.fn().mockResolvedValueOnce({
			status: 302,
			headers: {
				get: (name: string) =>
					name === "location"
						? "http://169.254.169.254/latest/meta-data/"
						: null,
			},
		});

		await expect(
			scrapeUrl("https://evil.example.com/redirect"),
		).rejects.toThrow("private");
	});

	it("should block redirects to loopback addresses", async () => {
		mockFetch = vi.fn().mockResolvedValueOnce({
			status: 301,
			headers: {
				get: (name: string) =>
					name === "location" ? "http://127.0.0.1/admin" : null,
			},
		});

		await expect(
			scrapeUrl("https://evil.example.com/redirect"),
		).rejects.toThrow("private");
	});

	it("should follow safe redirects successfully", async () => {
		const mockContent =
			"<html><head><title>Redirected</title></head><body>OK</body></html>";

		mockFetch = vi
			.fn()
			.mockResolvedValueOnce({
				status: 301,
				headers: {
					get: (name: string) =>
						name === "location" ? "https://example.com/final" : null,
				},
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
					get: (name: string) => (name === "content-type" ? "text/html" : null),
				},
				text: () => Promise.resolve(mockContent),
			});

		const result = await scrapeUrl("https://example.com/start", ["html"]);
		expect(result.html).toBe(mockContent);
		expect(result.title).toBe("Redirected");
	});

	it("should throw on too many redirects", async () => {
		mockFetch = vi.fn().mockResolvedValue({
			status: 302,
			headers: {
				get: (name: string) =>
					name === "location" ? "https://example.com/loop" : null,
			},
		});

		await expect(scrapeUrl("https://example.com/loop")).rejects.toThrow(
			"Too many redirects",
		);
	});
});

describe("scrapeUrl async extraction", () => {
	it.each([false, true])(
		"handles a timed-out auxiliary request: %s",
		async (timesOut) => {
			const html =
				"<article><h1>Local article</h1><p>The downloaded article has useful local content for readers to use when the auxiliary service is unavailable.</p></article>";
			mockFetch = vi.fn().mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: { get: () => "text/html" },
				text: () => Promise.resolve(html),
			});
			const controller = new AbortController();
			const timeout = vi
				.spyOn(AbortSignal, "timeout")
				.mockReturnValue(controller.signal);
			const auxiliary = vi
				.spyOn(globalThis, "fetch")
				.mockImplementation((_input, init) => {
					if (timesOut) {
						controller.abort(new DOMException("Timed out", "TimeoutError"));
						init?.signal?.throwIfAborted();
					}
					return Promise.resolve(
						new Response(
							JSON.stringify({
								text: "Auxiliary article content from the service",
							}),
							{ headers: { "content-type": "application/json" } },
						),
					);
				});
			try {
				const result = await scrapeUrl("https://wiki.c2.com/?ExamplePage", [
					"markdown",
				]);
				expect(timeout).toHaveBeenCalledWith(10_000);
				expect(auxiliary).toHaveBeenCalled();
				expect(result.markdown).toContain(
					timesOut ? "useful local content" : "Auxiliary article content",
				);
			} finally {
				auxiliary.mockRestore();
				timeout.mockRestore();
			}
		},
	);
});
