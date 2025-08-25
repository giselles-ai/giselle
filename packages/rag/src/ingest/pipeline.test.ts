import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChunkStore } from "../chunk-store/types";
import type { ChunkerFunction } from "../chunker/types";
import type { DocumentLoader } from "../document-loader/types";
import { createPipeline } from "./pipeline";

// Mock the data-type module for EMBEDDING_PROFILES
vi.mock("@giselle-sdk/data-type", () => ({
	EMBEDDING_PROFILES: {
		1: {
			provider: "openai",
			model: "text-embedding-3-small",
			dimensions: 1536,
			name: "OpenAI text-embedding-3-small",
		},
		2: {
			provider: "openai",
			model: "text-embedding-3-large",
			dimensions: 3072,
			name: "OpenAI text-embedding-3-large",
		},
		3: {
			provider: "google",
			model: "gemini-embedding-001",
			dimensions: 3072,
			name: "Google gemini-embedding-001",
		},
	},
}));

// Mock the embedder/profiles module
vi.mock("../embedder/profiles", () => ({
	// biome-ignore lint/correctness/noUnusedFunctionParameters: mock
	createEmbedderFromProfile: vi.fn((profileId, apiKey, options) => ({
		embed: vi.fn(async () => [0.1, 0.2, 0.3]),
		embedMany: vi.fn(async (texts) => texts.map(() => [0.1, 0.2, 0.3])),
	})),
}));

describe("createPipeline", () => {
	let mockDocumentLoader: DocumentLoader<{ path: string; version: string }>;
	let mockChunker: ChunkerFunction;
	let mockChunkStore: ChunkStore<{ path: string; version: string }>;

	beforeEach(() => {
		// Set up mock API key for tests
		process.env.OPENAI_API_KEY = "test-api-key";

		mockDocumentLoader = {
			async *loadMetadata() {
				yield await Promise.resolve({ path: "file1.txt", version: "v1" });
				yield await Promise.resolve({ path: "file2.txt", version: "v2" });
			},
			async loadDocument(metadata) {
				return await Promise.resolve({
					content: `doc for ${metadata.path}`,
					metadata,
				});
			},
		};

		mockChunker = vi.fn((text) => [`chunk1 of ${text}`, `chunk2 of ${text}`]);

		mockChunkStore = {
			insert: vi.fn(async () => {}),
			delete: vi.fn(async () => {}),
			deleteBatch: vi.fn(async () => {}),
			getDocumentVersions: vi.fn(async () => []),
		};
	});

	it("should process new documents through the pipeline", async () => {
		const ingest = createPipeline({
			documentLoader: mockDocumentLoader,
			chunker: mockChunker,
			embeddingProfileId: 1,
			chunkStore: mockChunkStore,
			documentKey: (metadata) => metadata.path,
			documentVersion: (metadata) => metadata.version,
			metadataTransform: (metadata) => metadata,
		});

		const result = await ingest();

		expect(result.totalDocuments).toBe(2);
		expect(result.successfulDocuments).toBe(2);
		expect(result.failedDocuments).toBe(0);
		expect(mockChunker).toHaveBeenCalledTimes(2);
		// Embedder is now mocked internally via createEmbedderFromProfile
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

		const ingest = createPipeline({
			documentLoader: mockDocumentLoader,
			chunker: mockChunker,
			embeddingProfileId: 1,
			chunkStore: failingChunkStore,
			documentKey: (metadata) => metadata.path,
			documentVersion: (metadata) => metadata.version,
			metadataTransform: (metadata) => metadata,
			maxRetries: 2,
			retryDelay: 10,
		});

		const result = await ingest();

		expect(result.successfulDocuments).toBe(2);
		expect(failingChunkStore.insert).toHaveBeenCalledTimes(3); // 1 fail + 1 success for first doc, 1 success for second doc
	});

	it("should call progress callback", async () => {
		const onProgress = vi.fn();

		const ingest = createPipeline({
			documentLoader: mockDocumentLoader,
			chunker: mockChunker,
			embeddingProfileId: 1,
			chunkStore: mockChunkStore,
			documentKey: (metadata) => metadata.path,
			documentVersion: (metadata) => metadata.version,
			metadataTransform: (metadata) => metadata,
			onProgress,
		});

		await ingest();

		expect(onProgress).toHaveBeenCalled();
		const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1][0];
		expect(lastCall.processedDocuments).toBe(2);
	});

	it("should handle batch processing", async () => {
		const ingest = createPipeline({
			documentLoader: mockDocumentLoader,
			chunker: mockChunker,
			embeddingProfileId: 1,
			chunkStore: mockChunkStore,
			documentKey: (metadata) => metadata.path,
			documentVersion: (metadata) => metadata.version,
			metadataTransform: (metadata) => metadata,
			maxBatchSize: 1,
		});

		await ingest();

		// Embedder is now mocked internally via createEmbedderFromProfile
		// Each document produces 2 chunks, so we should have 2 insert calls
		expect(mockChunkStore.insert).toHaveBeenCalledTimes(2);
	});
});

describe("createPipeline with differential ingestion", () => {
	let mockDocumentLoader: DocumentLoader<{ path: string; sha: string }>;
	let mockChunker: ChunkerFunction;
	let mockChunkStore: ChunkStore<{ path: string; sha: string }>;

	beforeEach(() => {
		// Set up mock API key for tests
		process.env.OPENAI_API_KEY = "test-api-key";

		mockDocumentLoader = {
			async *loadMetadata() {
				yield await Promise.resolve({ path: "file1.txt", sha: "sha1-new" });
				yield await Promise.resolve({ path: "file2.txt", sha: "sha2-same" });
				yield await Promise.resolve({ path: "file3.txt", sha: "sha3-new" });
			},
			async loadDocument(metadata) {
				return await Promise.resolve({
					content: `content of ${metadata.path}`,
					metadata,
				});
			},
		};

		mockChunker = vi.fn((text) => [`chunk1 of ${text}`, `chunk2 of ${text}`]);

		mockChunkStore = {
			insert: vi.fn(async () => {}),
			delete: vi.fn(async () => {}),
			deleteBatch: vi.fn(async () => {}),
			getDocumentVersions: vi.fn(async () => [
				{ documentKey: "file1.txt", version: "sha1-old" },
				{ documentKey: "file2.txt", version: "sha2-same" },
				{ documentKey: "file4.txt", version: "sha4-deleted" },
			]),
		};
	});

	it("should detect new, updated, and deleted documents", async () => {
		const ingest = createPipeline({
			documentLoader: mockDocumentLoader,
			chunker: mockChunker,
			embeddingProfileId: 1,
			chunkStore: mockChunkStore,
			documentKey: (metadata) => metadata.path,
			documentVersion: (metadata) => metadata.sha,
			metadataTransform: (metadata) => metadata,
		});

		const result = await ingest();

		// Should process only new and updated documents (file1.txt and file3.txt)
		expect(result.totalDocuments).toBe(2);
		expect(result.successfulDocuments).toBe(2);
		expect(result.failedDocuments).toBe(0);

		// Should call insert for new and updated documents
		expect(mockChunkStore.insert).toHaveBeenCalledTimes(2);
		expect(mockChunkStore.insert).toHaveBeenCalledWith(
			"file1.txt",
			expect.any(Array),
			{ path: "file1.txt", sha: "sha1-new" },
		);
		expect(mockChunkStore.insert).toHaveBeenCalledWith(
			"file3.txt",
			expect.any(Array),
			{ path: "file3.txt", sha: "sha3-new" },
		);

		// Should delete removed document
		expect(mockChunkStore.deleteBatch).toHaveBeenCalledTimes(1);
		expect(mockChunkStore.deleteBatch).toHaveBeenCalledWith(["file4.txt"]);
	});

	it("should handle deletion errors without throwing", async () => {
		const failingChunkStore = {
			...mockChunkStore,
			deleteBatch: vi
				.fn()
				.mockRejectedValueOnce(new Error("Batch delete failed")),
		};

		const ingest = createPipeline({
			documentLoader: mockDocumentLoader,
			chunker: mockChunker,
			embeddingProfileId: 1,
			chunkStore: failingChunkStore,
			documentKey: (metadata) => metadata.path,
			documentVersion: (metadata) => metadata.sha,
			metadataTransform: (metadata) => metadata,
		});

		// The ingest should complete successfully but include the error in results
		const result = await ingest();

		expect(result.totalDocuments).toBe(2);
		expect(result.successfulDocuments).toBe(2);
		expect(result.failedDocuments).toBe(0);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].document).toBe("batch-delete: file4.txt");
		expect(result.errors[0].error.message).toBe("Batch delete failed");
	});

	it("should update progress when deleting orphaned documents", async () => {
		const onProgress = vi.fn();

		const ingest = createPipeline({
			documentLoader: mockDocumentLoader,
			chunker: mockChunker,
			embeddingProfileId: 1,
			chunkStore: mockChunkStore,
			documentKey: (metadata) => metadata.path,
			documentVersion: (metadata) => metadata.sha,
			metadataTransform: (metadata) => metadata,
			onProgress,
		});

		await ingest();

		// Should call progress for processing 2 documents + 1 deletion
		const progressCalls = onProgress.mock.calls;
		const lastCall = progressCalls[progressCalls.length - 1][0];
		expect(lastCall.processedDocuments).toBe(3); // 2 processed + 1 deleted
	});

	it("should skip documents with unchanged versions", async () => {
		// All documents have the same version as stored
		const unchangedChunkStore = {
			...mockChunkStore,
			getDocumentVersions: vi.fn(async () => [
				{ documentKey: "file1.txt", version: "sha1-new" },
				{ documentKey: "file2.txt", version: "sha2-same" },
				{ documentKey: "file3.txt", version: "sha3-new" },
			]),
		};

		const ingest = createPipeline({
			documentLoader: mockDocumentLoader,
			chunker: mockChunker,
			embeddingProfileId: 1,
			chunkStore: unchangedChunkStore,
			documentKey: (metadata) => metadata.path,
			documentVersion: (metadata) => metadata.sha,
			metadataTransform: (metadata) => metadata,
		});

		const result = await ingest();

		// Should not process any documents since all versions match
		expect(result.totalDocuments).toBe(0);
		expect(result.successfulDocuments).toBe(0);
		expect(mockChunkStore.insert).not.toHaveBeenCalled();
		expect(unchangedChunkStore.deleteBatch).not.toHaveBeenCalled();
	});
});
