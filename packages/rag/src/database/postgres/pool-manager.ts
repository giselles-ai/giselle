import { Pool } from "pg";
import type { DatabaseConfig } from "../types";

const pools = new Map<string, Pool>();

function getPool(config: DatabaseConfig): Pool {
	const key = config.connectionString;

	let pool = pools.get(key);
	if (!pool) {
		pool = new Pool({
			connectionString: config.connectionString,
			...config.poolConfig,
		});

		// error handling
		pool.on("error", (err) => {
			console.error("Unexpected error on idle client", err);
		});

		pools.set(key, pool);
	}

	return pool;
}

async function closeAllPools(): Promise<void> {
	const promises = Array.from(pools.values()).map((pool) => pool.end());
	await Promise.all(promises);
	pools.clear();
}

async function closePool(connectionString: string): Promise<void> {
	const pool = pools.get(connectionString);
	if (pool) {
		await pool.end();
		pools.delete(connectionString);
	}
}

export const PoolManager = {
	getPool,
	closeAll: closeAllPools,
	close: closePool,
};
