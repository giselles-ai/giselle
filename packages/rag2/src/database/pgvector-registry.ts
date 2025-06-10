import type { PoolClient } from "pg";
import * as pgvector from "pgvector/pg";

/**
 * Singleton registry for pgvector type registration to avoid redundant calls
 * and improve performance across database operations.
 */
class PgVectorRegistry {
	private static instance: PgVectorRegistry;
	private registeredPools = new Set<string>();

	private constructor() {}

	/**
	 * Get the singleton instance of PgVectorRegistry
	 */
	static getInstance(): PgVectorRegistry {
		if (!PgVectorRegistry.instance) {
			PgVectorRegistry.instance = new PgVectorRegistry();
		}
		return PgVectorRegistry.instance;
	}

	/**
	 * Ensure pgvector types are registered for the given connection.
	 * Uses connection string as identifier to avoid duplicate registrations.
	 *
	 * @param client - PostgreSQL client connection
	 * @param connectionString - Database connection string for identification
	 */
	async ensureRegistered(
		client: PoolClient,
		connectionString: string,
	): Promise<void> {
		// Create a unique identifier for this connection pool
		const poolIdentifier = this.createPoolIdentifier(connectionString);

		if (!this.registeredPools.has(poolIdentifier)) {
			await pgvector.registerTypes(client);
			this.registeredPools.add(poolIdentifier);
		}
	}

	/**
	 * Create a consistent identifier for a connection pool
	 * This normalizes the connection string to handle minor variations
	 */
	private createPoolIdentifier(connectionString: string): string {
		try {
			const url = new URL(connectionString);
			// Use host, port, and database as the identifier
			// This avoids credentials in the identifier while maintaining uniqueness
			return `${url.hostname}:${url.port || 5432}/${url.pathname.slice(1)}`;
		} catch {
			// Fallback for non-URL connection strings
			return connectionString;
		}
	}

	/**
	 * Clear the registration cache (mainly for testing purposes)
	 */
	clearCache(): void {
		this.registeredPools.clear();
	}
}

/**
 * Convenience function to ensure pgvector types are registered
 *
 * @param client - PostgreSQL client connection
 * @param connectionString - Database connection string for identification
 */
export async function ensurePgVectorTypes(
	client: PoolClient,
	connectionString: string,
): Promise<void> {
	const registry = PgVectorRegistry.getInstance();
	await registry.ensureRegistered(client, connectionString);
}

/**
 * Clear the pgvector registration cache (for testing)
 */
export function clearPgVectorCache(): void {
	const registry = PgVectorRegistry.getInstance();
	registry.clearCache();
}
