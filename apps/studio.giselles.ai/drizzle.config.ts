import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

export default defineConfig({
	schema: "./drizzle/schema.ts",
	out: "./migrations",
	dialect: "postgresql",
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: Environment variable is required for drizzle config
		url: process.env.POSTGRES_URL!,
	},
});
