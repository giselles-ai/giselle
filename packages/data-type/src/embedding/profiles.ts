import type {
	EmbeddingDimensions,
	EmbeddingModelId,
	EmbeddingProvider,
} from "./index";

type EmbeddingProfile = {
	provider: EmbeddingProvider;
	model: EmbeddingModelId;
	dimensions: EmbeddingDimensions;
	name: string;
};

export const EMBEDDING_PROFILES = {
	1: {
		provider: "openai" as const,
		model: "text-embedding-3-small" as const,
		dimensions: 1536 as const,
		name: "OpenAI text-embedding-3-small",
	},
	2: {
		provider: "openai" as const,
		model: "text-embedding-3-large" as const,
		dimensions: 3072 as const,
		name: "OpenAI text-embedding-3-large",
	},
	3: {
		provider: "google" as const,
		model: "gemini-embedding-001" as const,
		dimensions: 3072 as const,
		name: "Google gemini-embedding-001",
	},
} as const satisfies Record<number, EmbeddingProfile>;

export type EmbeddingProfileId = keyof typeof EMBEDDING_PROFILES;

export function isEmbeddingProfileId(id: number): id is EmbeddingProfileId {
	return id === 1 || id === 2 || id === 3;
}
