import type { DatabaseConfig } from "@giselle-sdk/rag";

/**
 * Create database configuration for PostgreSQL connection
 */
export function createDatabaseConfig(): DatabaseConfig | null {
	const postgresUrl = process.env.POSTGRES_URL;
	if (!postgresUrl) {
		return null;
	}
	return { connectionString: postgresUrl };
}
