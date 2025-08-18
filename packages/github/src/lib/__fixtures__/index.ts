import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function loadFixture(filename: string): string {
	const currentFile = fileURLToPath(import.meta.url);
	const currentDir = dirname(currentFile);
	const fixturePath = join(currentDir, filename);
	return readFileSync(fixturePath, "utf-8");
}

export const PR_1118_DIFF = loadFixture("pr-1118.diff");
export const PR_22_DIFF = loadFixture("pr-22.diff");
