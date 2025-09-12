import type { EmbedderFunction } from "./types";

export function createNotImplementedEmbedder(
	provider: string,
): EmbedderFunction {
	return {
		embed() {
			return Promise.reject(
				new Error(`Embedder for provider ${provider} is not implemented`),
			);
		},
		embedMany() {
			return Promise.reject(
				new Error(`Embedder for provider ${provider} is not implemented`),
			);
		},
	};
}
