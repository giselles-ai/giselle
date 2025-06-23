export {
	createOpenAIEmbedder,
	type OpenAIEmbedderConfig,
} from "./openai";
export type { EmbedderFunction } from "./types";
import { createOpenAIEmbedder } from "./openai";

const DEFAULT_OPENAI_MODEL = "text-embedding-3-small";

/**
 * Create an OpenAI embedder with default configuration
 * @returns An embedder function using OpenAI's text-embedding-3-small model
 * @throws Error if OPENAI_API_KEY environment variable is not set
 */
export function createDefaultEmbedder() {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error("OPENAI_API_KEY environment variable is required");
	}
	return createOpenAIEmbedder({
		apiKey,
		model: DEFAULT_OPENAI_MODEL,
	});
}
