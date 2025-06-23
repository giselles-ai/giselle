import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_CHUNKER_CONFIG } from "./index";
import { type LineChunkerOptions, createLineChunker } from "./line-chunker";

const FIXTURES_DIR = join(__dirname, "__fixtures__");
const GOLDEN_DIR = join(__dirname, "__golden__");
const CHUNK_DELIMITER = "===== CHUNK";

function readFixture(path: string): string {
	return readFileSync(join(FIXTURES_DIR, path), "utf-8");
}

function getGoldenPath(fixtureName: string, configName: string): string {
	const baseName = basename(fixtureName, extname(fixtureName));
	const dirName = dirname(fixtureName);
	return join(GOLDEN_DIR, dirName, baseName, `${configName}.txt`);
}

function formatChunks(chunks: string[]): string {
	return chunks
		.map((chunk, index) => `${CHUNK_DELIMITER} ${index + 1} =====\n${chunk}`)
		.join("\n");
}

function parseChunks(text: string): string[] {
	const pattern = new RegExp(`${CHUNK_DELIMITER} \\d+ =====\\n`, "g");
	const parts = text.split(pattern);
	const chunks = parts.slice(1); // Skip the first empty element
	return chunks.map((chunk, index) => {
		// Only remove the trailing newline if it's not the last chunk
		// or if the original text ends with a delimiter
		if (index < chunks.length - 1 && chunk.endsWith("\n")) {
			return chunk.slice(0, -1);
		}
		return chunk;
	});
}

function compareWithGolden(
	goldenPath: string,
	actual: string[],
	updateGolden = false,
): void {
	const goldenData = formatChunks(actual);

	if (updateGolden || !existsSync(goldenPath)) {
		// Ensure directory exists
		mkdirSync(dirname(goldenPath), { recursive: true });
		writeFileSync(goldenPath, goldenData);
		console.log(`Golden file created/updated: ${goldenPath}`);
		return;
	}

	const expected = readFileSync(goldenPath, "utf-8");
	const expectedChunks = parseChunks(expected);
	expect(actual).toEqual(expectedChunks);
}

const TEST_CONFIGS: Record<string, Partial<LineChunkerOptions>> = {
	"small-chunks": { maxLines: 5, overlap: 1 },
	"large-chunks": { maxLines: 50, overlap: 10 },
	"no-overlap": { maxLines: 10, overlap: 0 },
	"char-limit": { maxLines: 100, maxChars: 200, overlap: 0 },
	"high-overlap": { maxLines: 10, overlap: 8 },
};

function getAllFiles(dir: string, baseDir: string = dir): string[] {
	const entries = readdirSync(dir);
	let files: string[] = [];
	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stats = statSync(fullPath);
		if (stats.isDirectory()) {
			files = files.concat(getAllFiles(fullPath, baseDir));
		} else {
			files.push(relative(baseDir, fullPath));
		}
	}
	return files;
}

const FIXTURES = getAllFiles(FIXTURES_DIR);

describe("LineChunker Golden Tests", () => {
	// Set to true to update golden files
	const UPDATE_GOLDEN = process.env.UPDATE_GOLDEN === "true";

	for (const fixture of FIXTURES) {
		describe(`Fixture: ${fixture}`, () => {
			const content = readFixture(fixture);

			for (const [configName, config] of Object.entries(TEST_CONFIGS)) {
				it(`should match golden data with config: ${configName}`, () => {
					const options = { ...DEFAULT_CHUNKER_CONFIG, ...config };
					const chunker = createLineChunker(options);
					const chunks = chunker(content);
					const goldenPath = getGoldenPath(fixture, configName);

					compareWithGolden(goldenPath, chunks, UPDATE_GOLDEN);
				});
			}
		});
	}

	describe("Chunk integrity validation", () => {
		it("should preserve all content when concatenating chunks", () => {
			const content = readFixture("code-sample.ts");
			const options = { ...DEFAULT_CHUNKER_CONFIG, maxLines: 10, overlap: 0 };
			const chunker = createLineChunker(options);
			const chunks = chunker(content);

			// All original content should be present when concatenating chunks
			const allContent = chunks.join("");
			expect(allContent).toContain("export interface User");
			expect(allContent).toContain("export class UserService");
			expect(allContent).toContain("export class PostService");
		});

		it("should ensure chunks have expected characteristics", () => {
			const content = readFixture("markdown-doc.md");
			const maxLines = 5;
			const maxChars = 300;
			const options = {
				...DEFAULT_CHUNKER_CONFIG,
				maxLines,
				maxChars,
				overlap: 2,
			};
			const chunker = createLineChunker(options);
			const chunks = chunker(content);

			for (const [index, chunk] of chunks.entries()) {
				expect(chunk.length).toBeLessThanOrEqual(maxChars);
				const lineCount = chunk.split("\n").length;
				if (index < chunks.length - 1) {
					expect(lineCount).toBeLessThanOrEqual(maxLines);
				}
				expect(chunk.length).toBeGreaterThan(0);
			}
		});

		it("should handle overlap correctly", () => {
			const content = readFixture("code-sample.ts");
			const overlap = 3;
			const options = { ...DEFAULT_CHUNKER_CONFIG, maxLines: 10, overlap };
			const chunker = createLineChunker(options);
			const chunks = chunker(content);

			for (let i = 0; i < chunks.length - 1; i++) {
				const currentLines = chunks[i].split("\n");
				const nextLines = chunks[i + 1].split("\n");

				const currentTail = currentLines.slice(-overlap).join("\n");
				const nextHead = nextLines.slice(0, overlap).join("\n");

				expect(currentTail).toBe(nextHead);
			}
		});
	});

	describe("Basic functionality", () => {
		it("should handle empty content", () => {
			const chunker = createLineChunker(DEFAULT_CHUNKER_CONFIG);
			const chunks = chunker("");
			expect(chunks).toEqual([]);
		});

		it("should handle single line", () => {
			const content = "This is a single line of text";
			const chunker = createLineChunker(DEFAULT_CHUNKER_CONFIG);
			const chunks = chunker(content);
			expect(chunks.length).toBe(1);
			expect(chunks[0]).toBe(content);
		});
	});
});

// Instructions for updating golden files:
// Run: UPDATE_GOLDEN=true pnpm test line-chunker.test.ts
