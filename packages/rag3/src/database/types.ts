export interface DatabaseConfig {
	connectionString: string;
	poolConfig?: {
		max?: number;
		idleTimeoutMillis?: number;
		connectionTimeoutMillis?: number;
	};
}

// define required columns
export interface RequiredColumns {
	documentKey: string;
	content: string;
	index: string;
	embedding: string;
}

// define column mapping (required columns are enforced)
export type ColumnMapping<TMetadata> = RequiredColumns & {
	[K in keyof TMetadata]: string;
};
