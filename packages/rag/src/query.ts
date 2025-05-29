import { OpenAIEmbedder } from "./embed";
import type {
	QueryFunction,
	QueryFunctionParams,
	QueryMetadataType,
	RecordValue,
} from "./types";

/**
 * Parameters for the main query function in packages/rag.
 */
type QueryParams<
	M extends QueryMetadataType,
	F = Record<string, RecordValue>,
> = {
	question: string;
	limit: number;
	filters: F;
	similarityThreshold?: number;
	queryFunction: QueryFunction<M, F>;
};

export async function query<
	M extends QueryMetadataType,
	F = Record<string, RecordValue>,
>(params: QueryParams<M, F>) {
	const {
		question,
		limit,
		filters,
		similarityThreshold = 0.5,
		queryFunction,
	} = params;

	// Validate question parameter
	if (
		!question ||
		typeof question !== "string" ||
		question.trim().length === 0
	) {
		throw new Error("Question must be a non-empty string");
	}

	// Validate limit parameter
	if (typeof limit !== "number" || limit <= 0 || !Number.isInteger(limit)) {
		throw new Error("Limit must be a positive integer");
	}

	// Validate queryFunction parameter
	if (typeof queryFunction !== "function") {
		throw new Error("Query function must be provided");
	}
	const embedder = new OpenAIEmbedder();
	const qEmbedding = await embedder.embed(question.trim());

	const queryFunctionArgs: QueryFunctionParams<F> = {
		embedding: qEmbedding,
		limit,
		filters,
		similarityThreshold,
	};

	try {
		return await queryFunction(queryFunctionArgs);
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		throw new Error(`Query function execution failed: ${err.message}`);
	}
}
