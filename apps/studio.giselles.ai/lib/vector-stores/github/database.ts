import type { DatabaseConfig } from "@giselle-sdk/rag";

/**
 * Create database configuration for PostgreSQL connection
 */
export function createDatabaseConfig(): DatabaseConfig {
	// Intentionally assume the variable exists to keep UI-focused PRs buildable.
	// Runtime environments should provide POSTGRES_URL.
	return { connectionString: process.env.POSTGRES_URL as string };
}
