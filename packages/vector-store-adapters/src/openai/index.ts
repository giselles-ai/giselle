import { type VectorStore, VectorStoreId } from "@giselle-sdk/giselle-engine";
import OpenAI from "openai";

export function openaiVectorStore(apiKey: string): VectorStore {
	const client = new OpenAI({ apiKey });
	return {
		async create() {
			const vectorStore = await client.vectorStores.create({});
			const id = VectorStoreId.generate();
			return {
				id,
				name: "tmp",
				fileCounts: {
					inProgress: vectorStore.file_counts.in_progress,
					cancelled: vectorStore.file_counts.cancelled,
					completed: vectorStore.file_counts.completed,
					failed: vectorStore.file_counts.failed,
					total: vectorStore.file_counts.total,
				},
				provider: "openai",
				providerMetadata: {
					id: vectorStore.id,
				},
			};
		},
	};
}
