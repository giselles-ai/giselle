import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts"],
		format: ["cjs", "esm"],
		dts: true,
		sourcemap: true,
	},
	{
		entry: ["src/react/index.ts"],
		format: ["cjs", "esm"],
		dts: true,
		outDir: "react/dist",
		sourcemap: true,
	},
]);
