#!/usr/bin/env tsx
/**
 * Script to generate true token counts using tiktoken.
 * This should be run to populate the trueTokens values in test/samples.ts.
 *
 * Usage:
 *   pnpm tsx scripts/generate-true-tokens.ts
 *
 * Note: This script requires tiktoken to be installed as a dev dependency.
 */

import { TOKEN_SAMPLES } from "../test/samples";

async function main() {
	// Dynamically import tiktoken (only available in dev)
	let encodingForModel: (model: string) => {
		encode: (text: string) => number[];
	};

	try {
		// Try to import tiktoken
		const tiktoken = await import("tiktoken");
		encodingForModel = tiktoken.encoding_for_model;
	} catch {
		console.error(
			"Error: tiktoken is not installed. Please install it as a dev dependency:",
		);
		console.error("  pnpm add -D tiktoken");
		process.exit(1);
	}

	const enc = encodingForModel("gpt-4o-mini");

	console.log("// Generated token counts using tiktoken (gpt-4o-mini)");
	console.log("// Run this script and update test/samples.ts with the output");
	console.log("");

	for (const sample of TOKEN_SAMPLES) {
		const tokens = enc.encode(sample.text);
		const count = tokens.length;
		console.log(`${sample.id}: ${count}`);
	}
}

main().catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
