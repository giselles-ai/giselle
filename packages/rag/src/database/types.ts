import { z } from "zod/v4";

export const DatabaseConfigSchema = z.object({
	connectionString: z.string().min(1, "Connection string cannot be empty"),
	poolConfig: z
		.object({
			max: z.number().int().positive("Pool max must be positive").optional(),
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
