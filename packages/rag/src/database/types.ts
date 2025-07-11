export interface DatabaseConfig {
	connectionString: string;
	poolConfig?: {
		max?: number;
		idleTimeoutMillis?: number;
		connectionTimeoutMillis?: number;
	};
}

export const REQUIRED_COLUMN_KEYS = [
	"documentKey",
	"chunkContent",
	"chunkIndex",
	"embedding",
	"version",
] as const;

export type RequiredColumns = Record<
	(typeof REQUIRED_COLUMN_KEYS)[number],
	string
>;

export type ColumnMapping<TMetadata> = Readonly<RequiredColumns> & {
	[K in Exclude<keyof TMetadata, keyof RequiredColumns>]: string;
};
