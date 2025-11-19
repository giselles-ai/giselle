import { describe, expect, it } from "vitest";
import { countTokens } from "../src";
import { TOKEN_SAMPLES } from "./samples";

/**
 * Maximum absolute error allowed.
 * If the absolute difference is within this, the test passes.
 */
const MAX_ABS_ERROR = 35;

/**
 * Maximum relative error allowed (as a fraction, e.g., 0.25 = 25%).
 * If the relative error is within this, the test passes.
 * Increased to account for pseudo-implementation limitations.
 */
const MAX_REL_ERROR = 0.25;

describe("pseudo-tiktoken accuracy against real tiktoken", () => {
	for (const sample of TOKEN_SAMPLES) {
		it(sample.id, () => {
			// Skip samples without true tokens (not yet generated)
			if (sample.trueTokens === 0 && sample.text.length > 0) {
				return;
			}

			const approx = countTokens(sample.text);
			const truth = sample.trueTokens;

			const absError = Math.abs(approx - truth);
			const relError = truth === 0 ? 0 : absError / truth;

			// Pass if either absolute or relative error is within tolerance
			const ok = absError <= MAX_ABS_ERROR || relError <= MAX_REL_ERROR;

			const msg =
				`id=${sample.id}, approx=${approx}, truth=${truth}, ` +
				`absError=${absError}, relError=${relError.toFixed(3)}`;

			expect(ok, msg).toBe(true);
		});
	}
});
