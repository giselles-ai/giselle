/**
 * Script to check token counts and accuracy for all samples.
 *
 * Usage:
 *   pnpm tsx scripts/check-token-ratios.ts
 */

import { countTokens } from "../src/index";
import { TOKEN_SAMPLES } from "../test/samples";

// ANSI escape codes for coloring output
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

// Table headers
const ID_WIDTH = 25;
const PSEUDO_WIDTH = 12;
const TRUE_WIDTH = 12;
const RATIO_WIDTH = 10;
const DIFF_WIDTH = 10;

console.log(
	BOLD +
		"ID".padEnd(ID_WIDTH) +
		"Pseudo".padEnd(PSEUDO_WIDTH) +
		"True".padEnd(TRUE_WIDTH) +
		"Ratio".padEnd(RATIO_WIDTH) +
		"Diff".padEnd(DIFF_WIDTH) +
		RESET,
);
console.log(
	"-".repeat(ID_WIDTH + PSEUDO_WIDTH + TRUE_WIDTH + RATIO_WIDTH + DIFF_WIDTH),
);

let totalPseudo = 0;
let totalTrue = 0;

for (const sample of TOKEN_SAMPLES) {
	if (
		sample.trueTokens === 0 &&
		sample.id !== "empty-string" &&
		sample.id !== "nextjs-llm"
	) {
		// Skip samples without true tokens (unless it's intentionally 0)
		// Note: nextjs-llm has trueTokens but if text is empty (file read fail) count is 0
		if (sample.text.length > 0) {
			// just skip printing if no true tokens to compare
			continue;
		}
	}

	if (
		sample.text.length === 0 &&
		sample.trueTokens === 0 &&
		sample.id !== "empty-string"
	) {
		// Skip failed file reads
		continue;
	}

	const pseudoCount = countTokens(sample.text);
	const trueCount = sample.trueTokens;
	const ratio = trueCount === 0 ? 0 : pseudoCount / trueCount;
	const diff = pseudoCount - trueCount;

	// Color coding for ratio
	let color = GREEN;
	if (Math.abs(1 - ratio) > 0.2) {
		color = RED;
	} else if (Math.abs(1 - ratio) > 0.1) {
		color = YELLOW;
	}

	console.log(
		color +
			sample.id.slice(0, ID_WIDTH - 1).padEnd(ID_WIDTH) +
			pseudoCount.toString().padEnd(PSEUDO_WIDTH) +
			trueCount.toString().padEnd(TRUE_WIDTH) +
			(trueCount === 0 ? "-" : ratio.toFixed(3)).padEnd(RATIO_WIDTH) +
			diff.toString().padEnd(DIFF_WIDTH) +
			RESET,
	);

	totalPseudo += pseudoCount;
	totalTrue += trueCount;
}

console.log(
	"-".repeat(ID_WIDTH + PSEUDO_WIDTH + TRUE_WIDTH + RATIO_WIDTH + DIFF_WIDTH),
);
const totalRatio = totalPseudo / totalTrue;
console.log(
	BOLD +
		"TOTAL".padEnd(ID_WIDTH) +
		totalPseudo.toString().padEnd(PSEUDO_WIDTH) +
		totalTrue.toString().padEnd(TRUE_WIDTH) +
		totalRatio.toFixed(3).padEnd(RATIO_WIDTH) +
		(totalPseudo - totalTrue).toString().padEnd(DIFF_WIDTH) +
		RESET,
);
