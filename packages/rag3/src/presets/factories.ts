import type { PostgresChunkStoreConfig } from "../chunk-store/postgres";
import { PostgresChunkStore } from "../chunk-store/postgres";
import { ValidationError } from "../errors";
import { IngestPipeline } from "../ingest";
import type { PostgresQueryServiceConfig } from "../query-service/postgres";
import { PostgresQueryService } from "../query-service/postgres";
import {
	type ChunkStoreConfig,
	type QueryServiceConfig,
	type SimpleIngestConfig,
	createColumnMapping,
	createDefaultChunker,
	createDefaultEmbedder,
} from "./index";

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
 * create chunk store
 */
export function createChunkStore<
	TMetadata extends Record<string, unknown> = Record<string, never>,
>(options: ChunkStoreConfig<TMetadata>): PostgresChunkStore<TMetadata> {
	const database = validateDatabaseConfig(options.database);

	const columnMapping =
		options.columnMapping ||
		createColumnMapping({
			metadataSchema: options.metadataSchema,
			requiredColumnOverrides: options.requiredColumnOverrides,
			metadataColumnOverrides: options.metadataColumnOverrides,
		});

	// PostgresChunkStoreConfigを構築
	const config: PostgresChunkStoreConfig<TMetadata> = {
		database,
		tableName: options.tableName,
		columnMapping,
		staticContext: options.staticContext,
		metadataSchema: options.metadataSchema,
	};

	return new PostgresChunkStore(config);
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

	// build PostgresQueryServiceConfig
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

/**
 * simplified ingest pipeline creation function
 * hide the details of chunker and embedder, and use default settings
 */
export function createIngestPipeline<
	TSourceMetadata extends Record<string, unknown>,
	TTargetMetadata extends Record<string, unknown> = TSourceMetadata,
>(config: SimpleIngestConfig<TSourceMetadata, TTargetMetadata>) {
	const {
		documentLoader,
		chunkStore,
		documentKey,
		metadataTransform,
		options = {},
	} = config;

	// use default embedder and chunker
	const embedder = createDefaultEmbedder();
	const chunker = createDefaultChunker();

	return new IngestPipeline({
		documentLoader,
		chunker,
		embedder,
		chunkStore,
		documentKey,
		metadataTransform,
		options: {
			batchSize: options.batchSize || 50,
			onProgress: options.onProgress,
		},
	});
}
