import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { z } from "zod/v4";
import { ConfigurationError } from "../errors";
import type { Embedder } from "./types";

const OpenAIEmbedderConfigSchema = z.object({
	apiKey: z
		.string()
		.min(1, "API key cannot be empty")
		.regex(/^sk-/, "API key must start with 'sk-'"),
	model: z
		.enum([
			"text-embedding-3-small",
			"text-embedding-3-large",
			"text-embedding-ada-002",
		])
		.optional()
		.default("text-embedding-3-small"),
	maxRetries: z
		.number()
		.int()
		.min(0, "Max retries must be non-negative")
		.max(10, "Max retries cannot exceed 10")
		.optional()
		.default(3),
});

export interface OpenAIEmbedderConfig {
	apiKey: string;
	model?: string;
	maxRetries?: number;
}

export class OpenAIEmbedder implements Embedder {
	private config: Required<OpenAIEmbedderConfig>;

	constructor(config: OpenAIEmbedderConfig) {
		// Validate configuration with Zod
		const validationResult = OpenAIEmbedderConfigSchema.safeParse(config);
		if (!validationResult.success) {
			throw ConfigurationError.invalidValue(
				"OpenAIEmbedderConfig",
				config,
				"Valid OpenAI embedder configuration",
				{
					operation: "constructor",
					validationErrors: validationResult.error.issues,
				},
			);
		}

		// Use validated and defaulted values
		const validatedConfig = validationResult.data;
		this.config = {
			apiKey: validatedConfig.apiKey,
			model: validatedConfig.model,
			maxRetries: validatedConfig.maxRetries,
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
