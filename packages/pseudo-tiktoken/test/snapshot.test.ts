import { describe, expect, it } from "vitest";
import { countTokens } from "../src";
import { TOKEN_SAMPLES } from "./samples";

describe("pseudo-tiktoken snapshot tests", () => {
	for (const sample of TOKEN_SAMPLES) {
		it(`should match snapshot for ${sample.id}`, () => {
			const tokenCount = countTokens(sample.text);
			expect(tokenCount).toMatchSnapshot();
		});
	}
});

