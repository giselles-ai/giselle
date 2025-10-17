import type { DatabaseConfig } from "@giselle-sdk/rag";

/**
 * Create database configuration for PostgreSQL connection
 */
export function createDatabaseConfig(): DatabaseConfig {
	const postgresUrl = process.env.POSTGRES_URL;
	if (!postgresUrl) {
		// Return a dummy connection string to avoid build-time crashes.
		// Call sites that actually attempt a DB connection should validate envs.
		return { connectionString: "postgres://invalid:invalid@localhost/invalid" };
	}
	return { connectionString: postgresUrl };
}
