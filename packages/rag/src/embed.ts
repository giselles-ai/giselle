import { openai } from "@ai-sdk/openai";
import { embed as embedCore } from "ai";
import type { Embedder } from "./types";

/**
 * OpenAIEmbedder handles embedding text using OpenAI's embedding models
 */
export class OpenAIEmbedder implements Embedder {
	private model: string;
	private maxRetries: number;

	constructor(model = "text-embedding-3-small", maxRetries = 2) {
		this.model = model;
		this.maxRetries = maxRetries;
	}

	/**
	 * Embed a single text using OpenAI's embedding model
	 * @param text - The text to embed
	 * @returns The embedded text as an array of numbers
	 */
	async embed(text: string): Promise<number[]> {
		const { embedding } = await embedCore({
			model: openai.embedding(this.model),
			value: text,
			maxRetries: this.maxRetries,
		});
		return embedding;
	}
}

/**
 * Helper function to create an OpenAIEmbedder with default settings
 */
export function createOpenAIEmbedder(
	model = "text-embedding-3-small",
	maxRetries = 2,
): Embedder {
	return new OpenAIEmbedder(model, maxRetries);
}
