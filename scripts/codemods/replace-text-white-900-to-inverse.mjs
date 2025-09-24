#!/usr/bin/env node
/**
 * replace-text-white-900-to-inverse.mjs
 *
 * Codemod: Replace `text-white-900` with `text-inverse`
 * - Targets: JSX/TSX/CSS (and optionally JS/JSX/TS/SCSS/MDX by default)
 * - Default mode: dry-run (prints summary without modifying files)
 *
 * Usage:
 *   node giselle/scripts/codemods/replace-text-white-900-to-inverse.mjs
 *   node giselle/scripts/codemods/replace-text-white-900-to-inverse.mjs --apply
 *   node giselle/scripts/codemods/replace-text-white-900-to-inverse.mjs --root . --apply
 *   node giselle/scripts/codemods/replace-text-white-900-to-inverse.mjs --ext ts,tsx,jsx,css --apply
 *
 * Notes:
 * - This is a straightforward string replacement (global) for `text-white-900` -> `text-inverse`.
 * - It intentionally keeps logic minimal and obvious (Less is more).
 */

import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import process from "node:process";

/** Configuration defaults */
const DEFAULT_EXTS = ["ts", "tsx", "jsx", "js", "css", "scss", "mdx"];
const DEFAULT_IGNORE_DIRS = new Set([
	"node_modules",
	".git",
	".next",
	"dist",
	"build",
	"out",
	"coverage",
]);

/** Replacement pair */
const FROM = "text-white-900";
const TO = "text-inverse";

/** CLI args */
function parseArgs(argv) {
	const args = {
		root: process.cwd(),
		apply: false,
		exts: DEFAULT_EXTS,
		verbose: false,
	};

	for (let i = 2; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--apply") {
			args.apply = true;
		} else if (a === "--verbose") {
			args.verbose = true;
		} else if (a === "--root") {
			const v = argv[++i];
			if (!v) fail("--root requires a value");
			args.root = resolve(v);
		} else if (a === "--ext") {
			const v = argv[++i];
			if (!v) fail("--ext requires a comma-separated value");
			args.exts = v
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
		} else if (a === "--help" || a === "-h") {
			printHelp();
			process.exit(0);
		} else {
			console.error(`Unknown argument: ${a}`);
			printHelp();
			process.exit(1);
		}
	}

	return args;
}

function printHelp() {
	console.log(`Replace 'text-white-900' with 'text-inverse' (dry-run by default)

Options:
  --apply           Write changes to disk (default: dry-run)
  --root <path>     Root directory to scan (default: current working directory)
  --ext <list>      Comma-separated list of file extensions (default: ${DEFAULT_EXTS.join(",")})
  --verbose         Print per-file details
  -h, --help        Show this help

Examples:
  node giselle/scripts/codemods/replace-text-white-900-to-inverse.mjs
  node giselle/scripts/codemods/replace-text-white-900-to-inverse.mjs --apply
  node giselle/scripts/codemods/replace-text-white-900-to-inverse.mjs --root . --ext ts,tsx,jsx,css --apply
`);
}

function fail(message) {
	console.error(`[codemod] ${message}`);
	process.exit(1);
}

/** Simple recursive directory walk with extension filtering and ignore list */
async function* walk(dir, exts, rootDir) {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const name = entry.name;
		if (entry.isDirectory()) {
			if (DEFAULT_IGNORE_DIRS.has(name)) continue;
			yield* walk(resolve(dir, name), exts, rootDir);
			continue;
		}
		// filter by extension
		const idx = name.lastIndexOf(".");
		if (idx === -1) continue;
		const ext = name.slice(idx + 1);
		if (!exts.includes(ext)) continue;
		yield resolve(dir, name);
	}
}

/** Perform a global replacement, returns number of replacements */
function replaceAllCount(haystack, needle, replacement) {
	if (!haystack.includes(needle))
		return { changed: false, count: 0, content: haystack };
	const count = haystack.split(needle).length - 1;
	const content = haystack.replaceAll(needle, replacement);
	return { changed: true, count, content };
}

async function main() {
	const args = parseArgs(process.argv);
	const root = args.root;
	const exts = args.exts;

	let scannedFiles = 0;
	let changedFiles = 0;
	let totalReplacements = 0;

	const changed = [];

	for await (const file of walk(root, exts, root)) {
		scannedFiles++;
		let content;
		try {
			const st = await stat(file);
			if (!st.isFile()) continue;
			content = await readFile(file, "utf8");
		} catch {
			continue;
		}

		const {
			changed: didChange,
			count,
			content: next,
		} = replaceAllCount(content, FROM, TO);
		if (!didChange) continue;

		totalReplacements += count;
		changedFiles++;
		changed.push({ file: relative(root, file), count });

		if (args.apply) {
			await writeFile(file, next, "utf8");
		}
	}

	// Output summary
	const summary = {
		root,
		exts,
		apply: args.apply,
		scannedFiles,
		changedFiles,
		totalReplacements,
		from: FROM,
		to: TO,
		changes: args.verbose ? changed : changed.slice(0, 50), // avoid too verbose by default
		truncated: !args.verbose && changed.length > 50 ? changed.length - 50 : 0,
	};

	console.log(JSON.stringify(summary, null, 2));

	if (!args.apply) {
		console.log(
			"\n[dry-run] No files were modified. Re-run with --apply to write changes.",
		);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
