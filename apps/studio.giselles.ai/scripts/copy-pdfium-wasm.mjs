import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const appRoot = path.resolve(path.dirname(scriptPath), "..");

const source = path.join(
	appRoot,
	"node_modules",
	"@embedpdf",
	"pdfium",
	"dist",
	"pdfium.wasm",
);
const destinationDir = path.join(
	appRoot,
	"lib",
	"vector-stores",
	"document",
	"ingest",
);
const destination = path.join(destinationDir, "pdfium.wasm");

try {
	await fs.mkdir(destinationDir, { recursive: true });
	await fs.copyFile(source, destination);

	console.log(`Copied pdfium.wasm -> ${path.relative(appRoot, destination)}`);
} catch (error) {
	console.error("Failed to copy pdfium.wasm", error);
	process.exitCode = 1;
}
