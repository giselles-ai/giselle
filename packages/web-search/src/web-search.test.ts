import { describe, expect, it } from "vitest";
import { webSearch } from "./index";

const TEST_URL = "https://example.com/";

const hasExternalApiEnv = process.env.VITEST_WITH_EXTERNAL_API === "1";

describe("webSearch (invalid URL)", () => {
	const tool = webSearch({ provider: "self-made" });
	it("should throw on invalid URL", async () => {
		await expect(tool.fetchUrl("not-a-url")).rejects.toThrow();
	});
});

(hasExternalApiEnv ? describe : describe.skip)(
	"webSearch self-made (valid URL)",
	() => {
		const tool = webSearch({ provider: "self-made" });
		it("should fetch a valid URL", async () => {
			const result = await tool.fetchUrl(TEST_URL, ["html"]);
			expect(result).toHaveProperty("html");
			expect(typeof result.html).toBe("string");
		});
	},
);
