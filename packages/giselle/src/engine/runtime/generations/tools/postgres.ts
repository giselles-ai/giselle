import { tool } from "ai";
import { Pool } from "pg";
import { z } from "zod";

export function createPostgresTools(connectionString: string) {
	const pool = new Pool({ connectionString });
	return {
		toolSet: {
			getTableStructure: tool({
				description:
					"Returns database table structure sorted by table and position.",
				inputSchema: z.object({}),
				execute: async () => {
					const client = await pool.connect();
					const res = await client.query(
						`
          SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns
           WHERE table_schema = 'public'
           ORDER BY table_name, ordinal_position;`,
					);
					client.release();
					return JSON.stringify(res.rows);
				},
			}),
			query: tool({
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
					}
				},
			}),
		} as const,
		cleanup: async () => {
			await pool.end();
		},
	};
}
