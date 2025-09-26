#!/usr/bin/env node
/**
 * Color usage report (rg-based, ESM, no TypeScript)
 *
 * Generates a JSON report summarizing color-related usages across the repo:
 * - Tailwind color utilities (text-*, bg-*, border-*, ring-*, outline-*, divide-*, from-*, via-*, to-*, fill-*, stroke-*)
 * - Specific key items: text-white-900, text-black-600/20, color-border-focused
 * - Color literals: hex (#fff/#ffffff/#ffffffff), rgba()/hsla()/hsl()/oklch()
 * - CSS variables: --color-*, --brand-*, --text-*, --bg-*, --surface-*, --border-*, --ring-*, --shadow-*
 * - SVG attributes: fill= / stroke= (in *.svg files only)
 *
 * Usage:
 *   node scripts/report-colors.mjs
 *   node scripts/report-colors.mjs --out .reports/report-colors.json
 *
 * Notes:
 * - Requires ripgrep (`rg`) to be installed and available on PATH.
 * - Excludes common build/output directories: node_modules, .next, dist, build, out, coverage
 * - Searches common source extensions: css, scss, ts, tsx, js, jsx, svg, md, mdx (except for the SVG-only query)
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * @typedef {{ type: "begin" | "match" | "end" | string, data: any }} RgEvent
 * @typedef {{ path: { text: string }, lines: { text: string }, line_number: number, absolute_offset: number, submatches: Array<{ start: number, end: number, match: { text: string } }> }} RgMatch
 * @typedef {{ path: string, line: number, match: string, context: string }} Finding
 */

/** @param {string} message */
function fail(message) {
	console.error(`[report-colors] ${message}`);
	process.exit(1);
}

function hasRg() {
	const res = spawnSync("rg", ["--version"], { encoding: "utf8" });
	return (
		res.status === 0 &&
		typeof res.stdout === "string" &&
		res.stdout.includes("ripgrep")
	);
}

/**
 * @param {string} pattern
 * @param {{ caseInsensitive?: boolean, svgOnly?: boolean }} opts
 * @returns {Finding[]}
 */
// Shared constants to prevent duplication
const EXCLUDE_GLOBS = [
	"!**/node_modules/**",
	"!**/.next/**",
	"!**/dist/**",
	"!**/build/**",
	"!**/out/**",
	"!**/coverage/**",
];

const INCLUDE_GLOBS_ALL = [
	"**/*.css",
	"**/*.scss",
	"**/*.ts",
	"**/*.tsx",
	"**/*.js",
	"**/*.jsx",
	"**/*.md",
	"**/*.mdx",
	"**/*.svg",
];

const INCLUDE_GLOBS_SVG = ["**/*.svg"];

function runRg(pattern, opts = {}) {
	const args = [
		"-n", // show line numbers
		"--json", // machine-readable
		"--hidden", // include dotfiles if any
	];

	// case-insensitive by default
	if (opts.caseInsensitive !== false) {
		args.push("-i");
	}

	// globs
	const includeGlobs = opts.svgOnly ? INCLUDE_GLOBS_SVG : INCLUDE_GLOBS_ALL;
	for (const g of EXCLUDE_GLOBS) args.push("--glob", g);
	for (const g of includeGlobs) args.push("--glob", g);

	// pattern
	args.push("-e", pattern);

	const res = spawnSync("rg", args, { encoding: "utf8" });
	// 0: matches found, 1: no matches, others: error
	if (res.status !== 0 && res.status !== 1) {
		if (res.stdout) console.error(res.stdout);
		if (res.stderr) console.error(res.stderr);
		fail(`ripgrep failed (status ${res.status}) for pattern: ${pattern}`);
	}

	const findings = [];

	const stdout = res.stdout || "";
	for (const line of stdout.split("\n")) {
		if (!line.trim()) continue;
		let ev;
		try {
			ev = JSON.parse(line);
		} catch {
			continue;
		}
		if (!ev || ev.type !== "match") continue;
		const m = ev.data;
		if (!m || !m.path || !m.lines) continue;
		const path = m.path.text;
		const lineNum = m.line_number;
		const context = m.lines.text;
		for (const sm of m.submatches || []) {
			findings.push({
				path,
				line: lineNum,
				match: sm.match.text,
				context,
			});
		}
	}

	return findings;
}

/** @param {Finding[]} items */
function uniqPaths(items) {
	return new Set(items.map((f) => f.path)).size;
}

/** @param {Finding[]} items @param {number} [n] */
function slicePreview(items, n = 10) {
	return items.slice(0, n);
}

function buildReport(rootDir) {
	// Patterns (as strings passed to rg, NOT JS RegExp)
	const patterns = {
		// Tailwind color utilities with optional scale and opacity suffix
		// e.g., text-white-900, bg-gray-200/20, border-brand-500, ring-focused
		tailwindUtilities:
			"\\b(?:text|bg|border|ring|outline|divide|from|via|to|fill|stroke)-[a-zA-Z-]+(?:-\\d{1,3})?(?:/\\d{1,3})?\\b",

		// Specific high-priority items to consolidate
		specific:
			"\\btext-white-900\\b|\\btext-black-600/20\\b|\\bcolor-border-focused\\b",

		// Hex colors, 3/4 or 6/8 digits
		hexColors: "#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b",

		// Functional notations
		functionalColors: "\\b(?:rgba?|hsla?|oklch)\\([^)]*\\)",

		// CSS variable definitions
		cssVariables:
			"--(?:color|brand|text|bg|surface|border|ring|shadow)[-\\w]*\\s*:",

		// SVG attributes (search *.svg only)
		svgAttrs: "\\b(?:fill|stroke)\\s*=",
	};

	// Run searches
	const tailwindUtilities = runRg(patterns.tailwindUtilities, {});
	const specific = runRg(patterns.specific, {});
	const hexColors = runRg(patterns.hexColors, {});
	const functionalColors = runRg(patterns.functionalColors, {});
	const cssVariables = runRg(patterns.cssVariables, {});
	const svgAttrs = runRg(patterns.svgAttrs, { svgOnly: true });

	// Special items extracted from specific results to avoid redundant searches
	const textWhite900 = specific.filter((f) => f.match === "text-white-900");
	const textBlack600_20 = specific.filter(
		(f) => f.match === "text-black-600/20",
	);
	const colorBorderFocused = specific.filter(
		(f) => f.match === "color-border-focused",
	);

	// Summary
	const breakdown = {
		tailwindUtilities: {
			matches: tailwindUtilities.length,
			files: uniqPaths(tailwindUtilities),
		},
		specific: {
			matches: specific.length,
			files: uniqPaths(specific),
		},
		hexColors: {
			matches: hexColors.length,
			files: uniqPaths(hexColors),
		},
		functionalColors: {
			matches: functionalColors.length,
			files: uniqPaths(functionalColors),
		},
		cssVariables: {
			matches: cssVariables.length,
			files: uniqPaths(cssVariables),
		},
		svgAttrs: {
			matches: svgAttrs.length,
			files: uniqPaths(svgAttrs),
		},
	};

	const totalMatches =
		breakdown.tailwindUtilities.matches +
		breakdown.specific.matches +
		breakdown.hexColors.matches +
		breakdown.functionalColors.matches +
		breakdown.cssVariables.matches +
		breakdown.svgAttrs.matches;

	const filesTouched = uniqPaths([
		...tailwindUtilities,
		...specific,
		...hexColors,
		...functionalColors,
		...cssVariables,
		...svgAttrs,
	]);

	return {
		generatedAt: new Date().toISOString(),
		rootDir,
		options: {
			caseInsensitive: true,
			excludeGlobs: EXCLUDE_GLOBS,
			includeGlobs: INCLUDE_GLOBS_ALL,
		},
		patterns: {
			tailwindUtilities: {
				regex: patterns.tailwindUtilities,
				totalMatches: breakdown.tailwindUtilities.matches,
				fileCount: breakdown.tailwindUtilities.files,
				preview: slicePreview(tailwindUtilities),
			},
			specific: {
				regex: patterns.specific,
				totalMatches: breakdown.specific.matches,
				fileCount: breakdown.specific.files,
				preview: slicePreview(specific),
			},
			hexColors: {
				regex: patterns.hexColors,
				totalMatches: breakdown.hexColors.matches,
				fileCount: breakdown.hexColors.files,
				preview: slicePreview(hexColors),
			},
			functionalColors: {
				regex: patterns.functionalColors,
				totalMatches: breakdown.functionalColors.matches,
				fileCount: breakdown.functionalColors.files,
				preview: slicePreview(functionalColors),
			},
			cssVariables: {
				regex: patterns.cssVariables,
				totalMatches: breakdown.cssVariables.matches,
				fileCount: breakdown.cssVariables.files,
				preview: slicePreview(cssVariables),
			},
			svgAttrs: {
				regex: patterns.svgAttrs,
				totalMatches: breakdown.svgAttrs.matches,
				fileCount: breakdown.svgAttrs.files,
				preview: slicePreview(svgAttrs),
			},
		},
		findings: {
			tailwindUtilities,
			specific,
			hexColors,
			functionalColors,
			cssVariables,
			svgAttrs,
		},
		specialItems: {
			textWhite900,
			textBlack600_20,
			colorBorderFocused,
		},
		summary: {
			totalMatches,
			filesTouched,
			breakdown,
		},
	};
}

/** @param {string[]} argv */
function parseArgs(argv) {
	const outIndex = argv.indexOf("--out");
	if (outIndex !== -1) {
		const val = argv[outIndex + 1];
		if (!val || val.startsWith("-")) {
			fail("Expected a value after --out");
		}
		return { outPath: val };
	}
	return { outPath: undefined };
}

(function main() {
	if (!hasRg()) {
		fail(
			"ripgrep (rg) not found on PATH. Please install ripgrep to run this script.",
		);
	}

	const cwd = process.cwd();
	const { outPath } = parseArgs(process.argv.slice(2));
	const report = buildReport(cwd);
	const json = JSON.stringify(report, null, 2);

	if (outPath) {
		const absOut = resolve(cwd, outPath);
		const dir = dirname(absOut);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		writeFileSync(absOut, json, "utf8");
		console.log(`[report-colors] Wrote report to ${absOut}`);
	} else {
		// Print to stdout for ad-hoc inspection
		console.log(json);
	}
})();
