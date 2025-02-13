import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	// This is a setting that refers to the tsconfig path setting
	plugins: [tsconfigPaths()],
	test: {
		environment: "node",
	},
});
