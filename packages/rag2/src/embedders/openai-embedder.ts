import OpenAI from "openai";
import { APIError, ConfigurationError, ValidationError } from "../errors";
import type { Embedder } from "../types";

export class OpenAIEmbedder implements Embedder {
	constructor(
		private openai: OpenAI,
		private model = "text-embedding-3-small",
	) {}

	async embed(text: string): Promise<number[]> {
		// Validate string content only (type already guarantees string)
		if (text.trim().length === 0) {
			throw new ValidationError("Text content cannot be empty", "text");
		}

		try {
			const response = await this.openai.embeddings.create({
				model: this.model,
				input: text,
			});

			// Validate response structure
			if (
				!response.data ||
				!Array.isArray(response.data) ||
				response.data.length === 0
			) {
				throw new APIError("Invalid response format from OpenAI", "openai");
			}

			const embedding = response.data[0]?.embedding;
			if (!Array.isArray(embedding)) {
				throw new APIError(
					"Missing or invalid embedding in OpenAI response",
					"openai",
				);
			}

			return embedding;
		} catch (error: unknown) {
			// Re-throw our own errors as-is
			if (error instanceof ValidationError || error instanceof APIError) {
				throw error;
			}

			// Handle OpenAI-specific errors
			if (
				error instanceof Error &&
				"status" in error &&
				typeof error.status === "number"
			) {
				const statusCode = error.status;
				if (statusCode === 401) {
					throw APIError.unauthorized("openai");
				}
				if (statusCode === 429) {
					throw APIError.rateLimited("openai");
				}
				throw APIError.requestFailed("openai", statusCode, error.message);
			}

			// Wrap unknown errors
			throw new APIError(
				`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`,
				"openai",
				undefined,
				error,
			);
		}
	}
}

export function createOpenAIEmbedder(model?: string): OpenAIEmbedder {
	// Validate environment variable (types cannot guarantee this)
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw ConfigurationError.missingEnvVar("OPENAI_API_KEY");
	}

	// Validate string content only (type already guarantees string | undefined)
	if (model !== undefined && model.trim().length === 0) {
		throw new ValidationError("Model name cannot be empty", "model");
	}

	try {
		const openai = new OpenAI({ apiKey });
		return new OpenAIEmbedder(openai, model);
	} catch (error) {
		throw new ConfigurationError(
			`Failed to initialize OpenAI client: ${error instanceof Error ? error.message : String(error)}`,
			"openai_client",
			error,
		);
	}
}
