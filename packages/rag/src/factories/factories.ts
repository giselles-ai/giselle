import { createColumnMapping } from "../database/utils";
import { createDefaultEmbedder } from "../embedder";
import { ValidationError } from "../errors";
import type { PostgresQueryServiceConfig } from "../query-service/postgres";
import { PostgresQueryService } from "../query-service/postgres";
import type { QueryServiceConfig } from "./types";

/**
 * validate database config
 */
function validateDatabaseConfig(database: {
	connectionString: string;
	poolConfig?: {
		max?: number;
		idleTimeoutMillis?: number;
		connectionTimeoutMillis?: number;
	};
}) {
	if (!database.connectionString || database.connectionString.length === 0) {
		throw new ValidationError("Connection string is required", undefined, {
			operation: "validateDatabaseConfig",
			field: "connectionString",
		});
	}

	if (database.poolConfig) {
		if (database.poolConfig.max !== undefined && database.poolConfig.max < 0) {
			throw new ValidationError("Pool max must be non-negative", undefined, {
				operation: "validateDatabaseConfig",
				field: "poolConfig.max",
			});
		}
		if (
			database.poolConfig.max !== undefined &&
			database.poolConfig.max > 100
		) {
			throw new ValidationError("Pool max must be 100 or less", undefined, {
				operation: "validateDatabaseConfig",
				field: "poolConfig.max",
			});
		}
		if (
			database.poolConfig.idleTimeoutMillis !== undefined &&
			database.poolConfig.idleTimeoutMillis < 0
		) {
			throw new ValidationError(
				"Pool idle timeout must be non-negative",
				undefined,
				{
					operation: "validateDatabaseConfig",
					field: "poolConfig.idleTimeoutMillis",
				},
			);
		}
	}

	return database;
}

/**
 * create query service
 */
export function createQueryService<
	TContext,
	TMetadata extends Record<string, unknown> = Record<string, never>,
>(
	options: QueryServiceConfig<TContext, TMetadata>,
): PostgresQueryService<TContext, TMetadata> {
	const database = validateDatabaseConfig(options.database);

	const columnMapping =
		options.columnMapping ||
		createColumnMapping({
			metadataSchema: options.metadataSchema,
			requiredColumnOverrides: options.requiredColumnOverrides,
			metadataColumnOverrides: options.metadataColumnOverrides,
		});

	const config: PostgresQueryServiceConfig<TContext, TMetadata> = {
		database,
		tableName: options.tableName,
		embedder: options.embedder || createDefaultEmbedder(),
		columnMapping,
		contextToFilter: options.contextToFilter,
		metadataSchema: options.metadataSchema,
	};

	return new PostgresQueryService(config);
}
