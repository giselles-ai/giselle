import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	// This is a setting that refers to the tsconfig path setting
	plugins: [tsconfigPaths()],
	test: {
		environment: "node",
		// Exclude E2E tests from Vitest since they are run with Playwright
		exclude: [...configDefaults.exclude, "tests/e2e/**"],
	},
});
