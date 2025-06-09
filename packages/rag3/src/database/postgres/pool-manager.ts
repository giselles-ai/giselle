import { Pool } from "pg";
import type { DatabaseConfig } from "../types";

const pools = new Map<string, Pool>();

export function getPool(config: DatabaseConfig): Pool {
	const key = config.connectionString;

	let pool = pools.get(key);
	if (!pool) {
		pool = new Pool({
			connectionString: config.connectionString,
			...config.poolConfig,
		});

		// エラーハンドリング
		pool.on("error", (err) => {
			console.error("Unexpected error on idle client", err);
		});

		pools.set(key, pool);
	}

	return pool;
}

export async function closeAllPools(): Promise<void> {
	const promises = Array.from(pools.values()).map((pool) => pool.end());
	await Promise.all(promises);
	pools.clear();
}

export async function closePool(connectionString: string): Promise<void> {
	const pool = pools.get(connectionString);
	if (pool) {
		await pool.end();
		pools.delete(connectionString);
	}
}

// PoolManager for backward compatibility
export const PoolManager = {
	getPool,
	closeAll: closeAllPools,
	close: closePool,
};
