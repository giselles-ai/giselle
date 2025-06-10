import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChunkStore } from "../chunk-store/types";
import type { Chunker } from "../chunker/types";
import type { DocumentLoader } from "../document-loader/types";
import type { Embedder } from "../embedder/types";
import { IngestPipeline } from "./ingest-pipeline";

describe("IngestPipeline", () => {
	let mockDocumentLoader: DocumentLoader<{ path: string }>;
	let mockChunker: Chunker;
	let mockEmbedder: Embedder;
	let mockChunkStore: ChunkStore<{ path: string }>;

	beforeEach(() => {
		mockDocumentLoader = {
			async *load() {
				yield { content: "doc1", metadata: { path: "file1.txt" } };
				yield { content: "doc2", metadata: { path: "file2.txt" } };
			},
		};

		mockChunker = {
			chunk: vi.fn((text) => [`chunk1 of ${text}`, `chunk2 of ${text}`]),
		};

		mockEmbedder = {
			embed: vi.fn(async () => [0.1, 0.2, 0.3]),
			embedMany: vi.fn(async (texts) => texts.map(() => [0.1, 0.2, 0.3])),
		};

		mockChunkStore = {
			insert: vi.fn(async () => {}),
			deleteByDocumentKey: vi.fn(async () => {}),
		};
	});

	it("should process documents through the pipeline", async () => {
		const pipeline = new IngestPipeline({
			documentLoader: mockDocumentLoader,
			chunker: mockChunker,
			embedder: mockEmbedder,
			chunkStore: mockChunkStore,
			documentKey: (doc) => doc.metadata.path,
			metadataTransform: (metadata) => metadata,
		});

		const result = await pipeline.ingest({});

		expect(result.totalDocuments).toBe(2);
		expect(result.successfulDocuments).toBe(2);
		expect(result.failedDocuments).toBe(0);
		expect(mockChunker.chunk).toHaveBeenCalledTimes(2);
		expect(mockEmbedder.embedMany).toHaveBeenCalledTimes(2);
		expect(mockChunkStore.insert).toHaveBeenCalledTimes(2);
	});

	it("should handle errors and retry", async () => {
		const failingChunkStore = {
			...mockChunkStore,
			insert: vi
				.fn()
				.mockRejectedValueOnce(new Error("First attempt failed"))
				.mockResolvedValueOnce(undefined),
		};

		const pipeline = new IngestPipeline({
			documentLoader: mockDocumentLoader,
			chunker: mockChunker,
			embedder: mockEmbedder,
			chunkStore: failingChunkStore,
			documentKey: (doc) => doc.metadata.path,
			metadataTransform: (metadata) => metadata,
			options: {
				maxRetries: 2,
				retryDelay: 10,
			},
		});

		const result = await pipeline.ingest({});

		expect(result.successfulDocuments).toBe(2);
		expect(failingChunkStore.insert).toHaveBeenCalledTimes(3); // 1 fail + 1 success for first doc, 1 success for second doc
	});

	it("should call progress callback", async () => {
		const onProgress = vi.fn();

		const pipeline = new IngestPipeline({
			documentLoader: mockDocumentLoader,
			chunker: mockChunker,
			embedder: mockEmbedder,
			chunkStore: mockChunkStore,
			documentKey: (doc) => doc.metadata.path,
			metadataTransform: (metadata) => metadata,
			options: { onProgress },
		});

		await pipeline.ingest({});

		expect(onProgress).toHaveBeenCalled();
		const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1][0];
		expect(lastCall.processedDocuments).toBe(2);
	});

	it("should handle batch processing", async () => {
		const pipeline = new IngestPipeline({
			documentLoader: mockDocumentLoader,
			chunker: mockChunker,
			embedder: mockEmbedder,
			chunkStore: mockChunkStore,
			documentKey: (doc) => doc.metadata.path,
			metadataTransform: (metadata) => metadata,
			options: { batchSize: 1 },
		});

		await pipeline.ingest({});

		// With batch size 1 and 2 chunks per document, should call embedMany 4 times
		expect(mockEmbedder.embedMany).toHaveBeenCalledTimes(4);
	});
});
