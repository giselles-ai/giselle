import { customType } from "drizzle-orm/pg-core";

/**
 * Custom vector type without fixed dimensions.
 *
 * Why this is needed:
 * - pgvector extension supports vectors without specifying dimensions at column definition
 * - Drizzle's built-in vector() type requires dimensions parameter, which doesn't support dynamic dimensions
 * - This custom type allows storing embeddings with different dimensions in the same column,
 *   enabling support for multiple embedding models with varying output dimensions
 *
 * @see https://orm.drizzle.team/docs/custom-types for creating custom types in Drizzle
 */
export const vectorWithoutDimensions = customType<{
	data: number[];
	driverData: string;
}>({
	dataType: () => "vector",
	toDriver: (v) => JSON.stringify(v),
	fromDriver: (v) => {
		if (typeof v === "string") {
			return v
				.slice(1, -1)
				.split(",")
				.map((val) => Number.parseFloat(val));
		}
		return v as number[];
	},
});
