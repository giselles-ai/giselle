import { PostgresChunkStore } from "../chunk-store/postgres";
import type { PostgresChunkStoreConfig } from "../chunk-store/postgres";
import { ValidationError } from "../errors";
import { PostgresQueryService } from "../query-service/postgres";
import type { PostgresQueryServiceConfig } from "../query-service/postgres";
import {
	type ChunkStoreConfig,
	type QueryServiceConfig,
	createColumnMapping,
	createDefaultEmbedder,
} from "./index";

/**
 * データベース設定を検証
 */
function validateDatabaseConfig(database: {
	connectionString: string;
	poolConfig?: {
		max?: number;
		idleTimeoutMillis?: number;
		connectionTimeoutMillis?: number;
	};
}) {
	if (!database.connectionString) {
		throw ValidationError.fromZodError(
			new Error("Connection string is required") as any,
			{ field: "connectionString" },
		);
	}
	return database;
}

/**
 * チャンクストアを作成する
 */
export function createChunkStore<
	TMetadata extends Record<string, unknown> = Record<string, never>,
>(options: ChunkStoreConfig<TMetadata>): PostgresChunkStore<TMetadata> {
	// データベース設定の検証
	const database = validateDatabaseConfig(options.database);

	// カラムマッピングを決定
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
 * クエリサービスを作成する
 */
export function createQueryService<
	TContext,
	TMetadata extends Record<string, unknown> = Record<string, never>,
>(
	options: QueryServiceConfig<TContext, TMetadata>,
): PostgresQueryService<TContext, TMetadata> {
	// データベース設定の検証
	const database = validateDatabaseConfig(options.database);

	// カラムマッピングを決定
	const columnMapping =
		options.columnMapping ||
		createColumnMapping({
			metadataSchema: options.metadataSchema,
			requiredColumnOverrides: options.requiredColumnOverrides,
			metadataColumnOverrides: options.metadataColumnOverrides,
		});

	// PostgresQueryServiceConfigを構築
	const config: PostgresQueryServiceConfig<TContext, TMetadata> = {
		database,
		tableName: options.tableName,
		embedder: options.embedder || createDefaultEmbedder(),
		columnMapping,
		contextToFilter: options.contextToFilter,
		searchOptions: options.searchOptions,
		metadataSchema: options.metadataSchema,
	};

	return new PostgresQueryService(config);
}
