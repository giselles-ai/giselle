import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts"],
		format: ["cjs", "esm"],
		dts: true,
		external: ["#tiptap-html"],
		sourcemap: true,
	},
]);
