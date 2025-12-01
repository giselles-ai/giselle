import fs from "node:fs";
import path from "node:path";
import type { KnipConfig } from "knip";

function getDepsFor(workspaceRelPath: string): Set<string> {
	const pkgPath = path.join(__dirname, workspaceRelPath, "package.json");
	try {
		const json = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
			dependencies?: Record<string, string>;
			devDependencies?: Record<string, string>;
		};
		return new Set([
			...Object.keys(json.dependencies ?? {}),
			...Object.keys(json.devDependencies ?? {}),
		]);
	} catch {
		return new Set();
	}
}

function filterExisting(
	pkgs: string[] | undefined,
	deps: Set<string>,
): string[] {
	if (!pkgs?.length) return [];
	return pkgs.filter((name) => deps.has(name));
}

const config: KnipConfig = {
	biome: false,
	ignoreIssues: {
		"apps/studio.giselles.ai/emails/**/*.tsx": ["duplicates"],
	},
	workspaces: {
		"apps/playground": {
			ignoreDependencies: [],
		},
		"apps/studio.giselles.ai": {
			entry: ["tests/e2e/global-setup.ts", "emails/**/*.tsx"],
			ignore: [
				"scripts/**",
				"trigger.config.ts",
				"trigger/investigate-private-key-job.ts",
			],
			// Ignore deps that are resolved dynamically in next.config or used only at build/runtime
			ignoreDependencies: filterExisting(
				[
					"@embedpdf/pdfium",
					"@opentelemetry/sdk-node",
					"import-in-the-middle",
					"require-in-the-middle",
					"@aws-sdk/client-s3",
					"pino-pretty",
					"@react-email/preview-server",
					"react-dom",
				],
				getDepsFor("apps/studio.giselles.ai"),
			),
		},
		"apps/ui.giselles.ai": {
			ignoreDependencies: ["tailwindcss"],
		},
		"internal-packages/ui": {
			ignoreDependencies: ["tailwindcss"],
		},
		"internal-packages/workflow-designer-ui": {
			ignoreDependencies: ["tailwindcss"],
			ignoreFiles: [
				// Not currently used in the product, but kept as a reference implementation for future use
				"src/editor/properties-panel/content-generation-node-properties-panel/**/*",
			],
		},
		"packages/rag": {
			ignore: ["src/chunker/__fixtures__/code-sample.ts"],
		},
	},
	ignore: ["turbo/generators/config.ts", ".github/**"],
	ignoreBinaries: ["vercel"],
};

export default config;
