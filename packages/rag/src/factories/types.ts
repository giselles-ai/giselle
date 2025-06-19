import type { z } from "zod/v4";
import type { ColumnMapping, RequiredColumns } from "../database/types";
import type { EmbedderFunction } from "../embedder/types";

/**
 * query service config
 */
export interface QueryServiceConfig<
	TContext,
	TMetadata extends Record<string, unknown>,
> {
	/**
	 * database config
	 */
	database: {
		connectionString: string;
		poolConfig?: {
			max?: number;
			idleTimeoutMillis?: number;
			connectionTimeoutMillis?: number;
		};
	};
	/**
	 * table name
	 */
	tableName: string;
	/**
	 * embedder
	 * if not provided, a default embedder will be used
	 */
	embedder?: EmbedderFunction;
	/**
	 * context to filter
	 */
	contextToFilter: (
		context: TContext,
	) => Record<string, unknown> | Promise<Record<string, unknown>>;
	/**
	 * metadata schema
	 */
	metadataSchema: z.ZodType<TMetadata>;
	/**
	 * required column overrides
	 */
	requiredColumnOverrides?: Partial<RequiredColumns>;
	/**
	 * metadata column overrides
	 */
	metadataColumnOverrides?: Partial<Record<keyof TMetadata, string>>;
	/**
	 * column mapping
	 */
	columnMapping?: ColumnMapping<TMetadata>;
}
