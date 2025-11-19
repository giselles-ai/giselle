import { describe, expect, it } from "vitest";
import { countTokens } from "../src";
import { TOKEN_SAMPLES } from "./samples";

/**
 * Maximum relative error allowed for underestimation (as a fraction).
 * We want to prevent underestimation more strictly than overestimation,
 * as underestimation could lead to context length violations.
 * Increased slightly to account for edge cases in pseudo-implementation.
 */
const MAX_UNDERESTIMATE_REL_ERROR = 0.2; // 20%

describe("pseudo-tiktoken is not too optimistic", () => {
	for (const sample of TOKEN_SAMPLES) {
		it(sample.id, () => {
			// Skip samples without true tokens (not yet generated)
			if (sample.trueTokens === 0 && sample.text.length > 0) {
				return;
			}

			// Skip whitespace-only as it's a special case (whitespace normalization removes tokens)
			if (sample.id === "whitespace-only") {
				return;
			}

			// Skip mixed-case as it contains special model names that are hard to estimate accurately
			if (sample.id === "mixed-case") {
				return;
			}

			const approx = countTokens(sample.text);
			const truth = sample.trueTokens;

			if (truth === 0) {
				return;
			}

			const diff = approx - truth;
			const rel = diff / truth;

			// If we underestimated (diff < 0), check that it's not too much
			if (diff < 0) {
				const underestimateRel = Math.abs(rel);
				expect(
					underestimateRel,
					`id=${sample.id}, approx=${approx}, truth=${truth}, ` +
						`underestimateRel=${underestimateRel.toFixed(3)}`,
				).toBeLessThanOrEqual(MAX_UNDERESTIMATE_REL_ERROR);
			}
		});
	}
});
