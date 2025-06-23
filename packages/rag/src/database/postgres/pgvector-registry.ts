import type { PoolClient } from "pg";
import * as pgvector from "pgvector/pg";

const registeredPools = new Set<string>();

function createPoolIdentifier(connectionString: string): string {
	try {
		const url = new URL(connectionString);
		return `${url.hostname}:${url.port || 5432}/${url.pathname.slice(1)}`;
	} catch {
		return connectionString;
	}
}

/**
 * Ensure pgvector types are registered for the given connection.
 * Uses connection string as identifier to avoid duplicate registrations.
 *
 * @param client - PostgreSQL client connection
 * @param connectionString - Database connection string for identification
 */
export async function ensurePgVectorTypes(
	client: PoolClient,
	connectionString: string,
): Promise<void> {
	const poolIdentifier = createPoolIdentifier(connectionString);

	if (!registeredPools.has(poolIdentifier)) {
		await pgvector.registerTypes(client);
		registeredPools.add(poolIdentifier);
	}
}

/**
 * Clear the pgvector registration cache (for testing)
 */
export function clearPgVectorCache(): void {
	registeredPools.clear();
}
