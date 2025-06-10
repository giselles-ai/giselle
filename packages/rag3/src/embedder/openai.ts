import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import type { Embedder } from "./types";

export interface OpenAIEmbedderConfig {
	apiKey: string;
	model?: string;
	maxRetries?: number;
}

export class OpenAIEmbedder implements Embedder {
	private config: Required<OpenAIEmbedderConfig>;

	constructor(config: OpenAIEmbedderConfig) {
		this.config = {
			maxRetries: 3,
			model: config.model ?? "text-embedding-3-small",
			...config,
		};
	}

	async embed(text: string): Promise<number[]> {
		const { embedding } = await embed({
			model: openai.embedding(this.config.model),
			maxRetries: this.config.maxRetries,
			value: text,
		});
		return embedding;
	}

	async embedMany(texts: string[]): Promise<number[][]> {
		const { embeddings } = await embedMany({
			model: openai.embedding(this.config.model),
			maxRetries: this.config.maxRetries,
			values: texts,
		});
		return embeddings;
	}
}
