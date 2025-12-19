import type { KnipConfig } from "knip";

const config: KnipConfig = {
	biome: false,
	ignoreIssues: {
		"apps/studio.giselles.ai/emails/**/*.tsx": ["duplicates"],
	},
	workspaces: {
		"apps/playground": {
			ignoreDependencies: [
				"@aws-sdk/client-s3",
				"@supabase/realtime-js",
				"@supabase/supabase-js",
				"happy-dom",
				"jsdom",
				"pg",
			],
		},
		"apps/studio.giselles.ai": {
			entry: ["emails/**/*.tsx"],
			ignore: [
				"scripts/**",
				"trigger.config.ts",
				"trigger/investigate-private-key-job.ts",
				// TaskUI is being migrated, remove this and clean up once migration is complete
				"app/(main)/tasks/[taskId]/actions.ts",
				"app/(main)/tasks/[taskId]/lib/utils.ts",
				"app/(main)/tasks/[taskId]/ui/run-in-studio-only-chip.tsx",
				"app/(main)/tasks/[taskId]/ui/step-error-state.tsx",
				"app/(main)/tasks/[taskId]/ui/steps-section.tsx",
				"app/(main)/tasks/[taskId]/ui/task-header.tsx",
			],
			// Ignore deps that are resolved dynamically in next.config or used only at build/runtime
			ignoreDependencies: [
				"@aws-sdk/client-s3",
				"@embedpdf/pdfium",
				"import-in-the-middle",
				"require-in-the-middle",
				"@react-email/preview-server",
				"pino-pretty",
			],
		},
		"apps/ui.giselles.ai": {
			ignoreDependencies: [],
		},
		"internal-packages/ui": {
			ignoreDependencies: [],
		},
		"internal-packages/workflow-designer-ui": {
			ignoreDependencies: [],
			ignore: [
				// Not currently used in the product, but kept as a reference implementation for future use
				"src/editor/properties-panel/content-generation-node-properties-panel/**/*",
				// Will be used in the future
				"src/editor/properties-panel/app-entry-node-properties-panel/app-icon-select.tsx",
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
