import type { PostgresTool } from "@giselles-ai/language-model-registry";
import { type ToolSet, tool } from "ai";
import { Pool } from "pg";
import * as z from "zod/v4";
import type { GiselleContext } from "../../../types";

export function createPostgresTool({
	connectionString,
	toolDefs,
	useTools,
	context,
}: {
	connectionString: string;
	toolDefs: readonly PostgresTool[];
	useTools: string[];
	context: GiselleContext;
}) {
	const pool = new Pool({ connectionString });

	const toolSet: ToolSet = {};

	for (const toolDef of toolDefs) {
		if (!useTools.includes(toolDef.name)) {
			continue;
		}
		switch (toolDef.name) {
			case "getTableStructure":
				toolSet.postgres_getTableStructure = tool({
					description:
						"Returns database table structure sorted by table and position.",
					inputSchema: z.object({}),
					execute: async () => {
						context.logger.debug("Getting table structure");
						const client = await pool.connect();
						const res = await client.query(
							`
            SELECT table_name, column_name, data_type, is_nullable
              FROM information_schema.columns
             WHERE table_schema = 'public'
             ORDER BY table_name, ordinal_position;`,
						);
						client.release();
						context.waitUntil(async () => {
							await pool.end();
							context.logger.debug("Postgres tool ended");
						});
						return JSON.stringify(res.rows);
					},
				});
				break;
			case "query":
				toolSet.postgres_query = tool({
					description: "Run a SQL query",
					inputSchema: z.object({
						query: z.string().min(1).max(1000),
					}),
					execute: async ({ query }) => {
						try {
							const res = await pool.query(query);
							return res.rows;
						} catch (e) {
							return e;
						} finally {
							context.waitUntil(async () => {
								await pool.end();
								context.logger.debug("Postgres tool ended");
							});
						}
					},
				});
				break;
			default: {
				const _exhaustiveCheck: never = toolDef;
				throw new Error(`Unknown tool name: ${_exhaustiveCheck}`);
			}
		}
	}
	return toolSet;
}
