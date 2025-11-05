import { DEFAULT_EMBEDDING_PROFILE_ID } from "@giselle-ai/protocol";
import { describe, expect, it } from "vitest";
import { mapMetadataToColumns, prepareChunkRecords } from "./utils";

describe("chunk-store/postgres/utils", () => {
	describe("mapMetadataToColumns", () => {
		it("should map metadata fields to column names", () => {
			const metadata = {
				title: "Test",
				author: "Author",
				tags: ["tag1", "tag2"],
			};

			const columnMapping = {
				documentKey: "doc_key",
				chunkContent: "content",
				chunkIndex: "idx",
				version: "version",
				title: "title_col",
				author: "author_col",
				tags: "tags_col",
			};

			const result = mapMetadataToColumns(metadata, columnMapping);

			expect(result).toEqual({
				title_col: "Test",
				author_col: "Author",
				tags_col: ["tag1", "tag2"],
			});
		});

		it("should exclude required column names from metadata mapping", () => {
			const metadata = {
				documentKey: "should-be-excluded",
				chunkContent: "should-be-excluded",
				title: "Test",
			};

			const columnMapping = {
				documentKey: "doc_key",
				chunkContent: "content",
				chunkIndex: "idx",
				version: "version",
				title: "title_col",
			};

			const result = mapMetadataToColumns(metadata, columnMapping);

			expect(result).toEqual({
				title_col: "Test",
			});
			expect(result.doc_key).toBeUndefined();
			expect(result.content).toBeUndefined();
		});
	});

	describe("prepareChunkRecords", () => {
		it("should prepare chunk records for insertion", () => {
			const chunks = [
				{ content: "chunk1", index: 0, embedding: [1, 2, 3] },
				{ content: "chunk2", index: 1, embedding: [4, 5, 6] },
			];

			const metadata = {
				title: "Test",
				author: "Author",
			};

			const columnMapping = {
				documentKey: "doc_key",
				chunkContent: "content",
				chunkIndex: "idx",
				version: "version",
				title: "title_col",
				author: "author_col",
			};

			const records = prepareChunkRecords(
				"doc123",
				chunks,
				metadata,
				columnMapping,
				{},
				1, // embeddingProfileId
				1536, // embeddingDimensions
			);

			expect(records).toHaveLength(2);
			expect(records[0]).toEqual({
				record: {
					doc_key: "doc123",
					content: "chunk1",
					idx: 0,
					title_col: "Test",
					author_col: "Author",
				},
				embedding: {
					embeddingValue: [1, 2, 3],
					embeddingProfileId: DEFAULT_EMBEDDING_PROFILE_ID,
					embeddingDimensions: 1536,
				},
			});
			expect(records[1].record.idx).toBe(1);
			expect(records[1].embedding.embeddingValue).toEqual([4, 5, 6]);
		});

		it("should include scope in records", () => {
			const chunks = [{ content: "chunk1", index: 0, embedding: [1, 2, 3] }];

			const metadata = { title: "Test" };
			const columnMapping = {
				documentKey: "doc_key",
				chunkContent: "content",
				chunkIndex: "idx",
				version: "version",
				title: "title_col",
			};

			const scope = {
				team_id: 123,
			};

			const records = prepareChunkRecords(
				"doc123",
				chunks,
				metadata,
				columnMapping,
				scope,
				1, // embeddingProfileId
				1536, // embeddingDimensions
			);

			expect(records[0].record).toMatchObject({
				doc_key: "doc123",
				content: "chunk1",
				idx: 0,
				title_col: "Test",
				team_id: 123,
			});
		});

		it("replaces NUL bytes in chunk content with a safe character", () => {
			const chunks = [
				{ content: "hello\u0000world", index: 0, embedding: [1, 2] },
			];

			const metadata = {};
			const columnMapping = {
				documentKey: "doc_key",
				chunkContent: "content",
				chunkIndex: "idx",
				version: "version",
			};

			const [record] = prepareChunkRecords(
				"doc123",
				chunks,
				metadata,
				columnMapping,
				{},
				1,
				2,
			);

			expect(record.record.content).toBe("hello\uFFFDworld");
		});
	});
});
