import { OpenAIEmbedder } from "./embed";
import type {
	MetadataType,
	QueryFunction,
	QueryFunctionParams,
	RecordValue,
} from "./types";

/**
 * Parameters for the main query function in packages/rag.
 */
type QueryParams<M extends MetadataType, F = Record<string, RecordValue>> = {
	question: string;
	limit: number;
	filters: F;
	similarityThreshold?: number;
	queryFunction: QueryFunction<M, F>;
};

export async function query<
	M extends MetadataType,
	F = Record<string, RecordValue>,
>(params: QueryParams<M, F>) {
	const {
		question,
		limit,
		filters,
		similarityThreshold = 0.5,
		queryFunction,
	} = params;
	if (question.length === 0) {
		throw new Error("Question cannot be empty");
	}
	const embedder = new OpenAIEmbedder();
	const qEmbedding = await embedder.embed(question);

	const queryFunctionArgs: QueryFunctionParams<F> = {
		embedding: qEmbedding,
		limit,
		filters,
		similarityThreshold,
	};

	return await queryFunction(queryFunctionArgs);
}
