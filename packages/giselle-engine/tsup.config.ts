import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts"],
		format: ["cjs", "esm"],
		dts: true,
		sourcemap: true,
	},
	{
		entry: ["src/next/index.ts"],
		outDir: "next/dist",
		format: ["cjs", "esm"],
		dts: true,
		sourcemap: true,
	},
	{
		entry: ["src/react/index.ts"],
		outDir: "react/dist",
		format: ["cjs", "esm"],
		dts: true,
		sourcemap: true,
	},
]);
