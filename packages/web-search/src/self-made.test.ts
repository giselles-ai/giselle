import { describe, expect, it } from "vitest";
import { scrapeUrl } from "./self-made";

const TEST_URL = "https://example.com/";

const hasExternalApiEnv = process.env.VITEST_WITH_EXTERNAL_API === "1";

describe("scrapeUrl (invalid URL)", () => {
	it("should throw on invalid URL", async () => {
		await expect(scrapeUrl("not-a-url")).rejects.toThrow();
	});
});

// Only run network-dependent tests if VITEST_WITH_EXTERNAL_API is set
(hasExternalApiEnv ? describe : describe.skip)("scrapeUrl (valid URL)", () => {
	it("should fetch a valid URL and return html (markdown empty)", async () => {
		const result = await scrapeUrl(TEST_URL, ["html"]);
		expect(result).toHaveProperty("html");
		expect(result).toHaveProperty("markdown");
		expect(typeof result.html).toBe("string");
		expect(result.markdown).toBe("");
	});

	it("should fetch a valid URL and return markdown (html empty)", async () => {
		const result = await scrapeUrl(TEST_URL, ["markdown"]);
		expect(result).toHaveProperty("html");
		expect(result).toHaveProperty("markdown");
		expect(result.html).toBe("");
		expect(typeof result.markdown).toBe("string");
		expect(result.markdown.length).toBeGreaterThan(0);
	});

	it("should fetch a valid URL and return both html and markdown", async () => {
		const result = await scrapeUrl(TEST_URL, ["html", "markdown"]);
		expect(result).toHaveProperty("html");
		expect(result).toHaveProperty("markdown");
		expect(typeof result.html).toBe("string");
		expect(typeof result.markdown).toBe("string");
		expect(result.html.length).toBeGreaterThan(0);
		expect(result.markdown.length).toBeGreaterThan(0);
	});
});
