import { describe, expect, it } from "vitest";
import { scrapeUrl } from "./firecrawl";

const TEST_URL = "https://example.com/";
const HEAVY_TEST_TIMEOUT = 20000;
const apiKey = process.env.FIRECRAWL_API_KEY || "";

describe("scrapeUrl (invalid URL)", () => {
	it("should throw on invalid URL", async () => {
		await expect(scrapeUrl("not-a-url", apiKey)).rejects.toThrow();
	});
});

// Only run external API tests if VITEST_WITH_EXTERNAL_API environment variable is set
const hasExternalApiEnv = process.env.VITEST_WITH_EXTERNAL_API === "1";

(hasExternalApiEnv ? describe : describe.skip)("scrapeUrl (valid URL)", () => {
	it(
		"should scrape a valid URL and return html (markdown empty)",
		async () => {
			const result = await scrapeUrl(TEST_URL, apiKey, ["html"]);
			expect(result).toHaveProperty("html");
			expect(result).toHaveProperty("markdown");
			expect(typeof result.html).toBe("string");
			expect(result.markdown).toBe("");
		},
		HEAVY_TEST_TIMEOUT,
	);

	it(
		"should scrape a valid URL and return markdown (html empty)",
		async () => {
			const result = await scrapeUrl(TEST_URL, apiKey, ["markdown"]);
			expect(result).toHaveProperty("html");
			expect(result).toHaveProperty("markdown");
			expect(result.html).toBe("");
			expect(typeof result.markdown).toBe("string");
			expect(result.markdown.length).toBeGreaterThan(0);
		},
		HEAVY_TEST_TIMEOUT,
	);

	it(
		"should scrape a valid URL and return both html and markdown",
		async () => {
			const result = await scrapeUrl(TEST_URL, apiKey, ["html", "markdown"]);
			expect(result).toHaveProperty("html");
			expect(result).toHaveProperty("markdown");
			expect(typeof result.html).toBe("string");
			expect(typeof result.markdown).toBe("string");
			expect(result.html.length).toBeGreaterThan(0);
			expect(result.markdown.length).toBeGreaterThan(0);
		},
		HEAVY_TEST_TIMEOUT,
	);
});
