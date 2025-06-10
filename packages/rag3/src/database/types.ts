import { z } from "zod/v4";

export const DatabaseConfigSchema = z.object({
	connectionString: z
		.string()
		.min(1, "Connection string cannot be empty")
		.url("Connection string must be a valid URL"),
	poolConfig: z
		.object({
			max: z
				.number()
				.int()
				.positive("Pool max must be positive")
				.max(100, "Pool max cannot exceed 100")
				.optional(),
			idleTimeoutMillis: z
				.number()
				.int()
				.nonnegative("Idle timeout must be non-negative")
				.optional(),
			connectionTimeoutMillis: z
				.number()
				.int()
				.positive("Connection timeout must be positive")
				.optional(),
		})
		.optional(),
});

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
