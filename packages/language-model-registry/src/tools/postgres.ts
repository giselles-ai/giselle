import * as z from "zod/v4";
import { defineLanguageModelTool, defineTool } from "./tool";

const postgresTools = [
	defineTool({
		name: "getTableStructure",
		title: "Get Table Structure",
		description:
			"Returns database table structure sorted by table and position.",
	}),
	defineTool({
		name: "query",
		title: "Query",
		description: "Run a SQL query",
		schema: z.object({
			query: z.string().min(1).max(1000),
		}),
	}),
] as const;
export type PostgresTool = (typeof postgresTools)[number];

export const postgres = defineLanguageModelTool({
	name: "postgres",
	title: "PostgreSQL",
	provider: "giselle",
	tools: postgresTools,
	configurationOptions: {
		secretId: {
			name: "secretId",
			type: "text",
			title: "Secret ID",
		},
		useTools: {
			name: "useTools",
			type: "toolSelection",
			title: "Use Tools",
		},
	},
});
