import { EmbeddingError } from "../errors";
import type { Embedder } from "./types";

export interface OpenAIEmbedderConfig {
	apiKey: string;
	model?: string;
	dimensions?: number;
	maxRetries?: number;
}

export class OpenAIEmbedder implements Embedder {
	private config: Required<OpenAIEmbedderConfig>;

	constructor(config: OpenAIEmbedderConfig) {
		this.config = {
			model: "text-embedding-3-small",
			dimensions: 1536,
			maxRetries: 3,
			...config,
		};
	}

	async embed(text: string): Promise<number[]> {
		const embeddings = await this.embedBatch([text]);
		return embeddings[0];
	}

	async embedBatch(texts: string[]): Promise<number[][]> {
		if (texts.length === 0) {
			return [];
		}

		try {
			const response = await this.makeRequest({
				model: this.config.model,
				input: texts,
				dimensions: this.config.dimensions,
			});

			return response.data.map(
				(item: { embedding: number[] }) => item.embedding,
			);
		} catch (error) {
			throw EmbeddingError.apiError(
				error instanceof Error ? error : undefined,
				{ model: this.config.model, textCount: texts.length },
			);
		}
	}

	private async makeRequest(body: Record<string, unknown>): Promise<{
		data: Array<{ embedding: number[] }>;
	}> {
		let lastError: Error | undefined;

		for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
			try {
				const response = await fetch("https://api.openai.com/v1/embeddings", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${this.config.apiKey}`,
					},
					body: JSON.stringify(body),
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
				}

				return await response.json();
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				if (attempt < this.config.maxRetries - 1) {
					// 指数バックオフ
					const delay = 2 ** attempt * 1000;
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		throw lastError;
	}
}
