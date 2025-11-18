import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

export default defineConfig({
	schema: "./db/schema.ts",
	out: "./db/migrate",
	dialect: "postgresql",
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: environment variable is defined
		url: process.env.POSTGRES_URL!,
	},
});
