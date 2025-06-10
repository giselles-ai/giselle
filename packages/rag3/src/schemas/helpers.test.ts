import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import {
	addTypeDiscriminator,
	createColumnMappingFromZod,
	validateMetadata,
} from "./helpers";

describe("createColumnMappingFromZod", () => {
	it("should create column mapping with default snake_case conversion", () => {
		const schema = z.object({
			userId: z.string(),
			userName: z.string(),
			createdAt: z.date(),
		});

		const mapping = createColumnMappingFromZod(schema);

		expect(mapping).toEqual({
			documentKey: "document_key",
			content: "content",
			index: "index",
			embedding: "embedding",
			userId: "user_id",
			userName: "user_name",
			createdAt: "created_at",
		});
	});

	it("should respect custom mappings", () => {
		const schema = z.object({
			userId: z.string(),
			userName: z.string(),
		});

		const mapping = createColumnMappingFromZod(schema, {
			customMappings: {
				userId: "custom_user_id_column",
			},
		});

		expect(mapping).toEqual({
			documentKey: "document_key",
			content: "content",
			index: "index",
			embedding: "embedding",
			userId: "custom_user_id_column",
			userName: "user_name",
		});
	});

	it("should support different case conversions", () => {
		const schema = z.object({
			userId: z.string(),
			userName: z.string(),
		});

		const camelCaseMapping = createColumnMappingFromZod(schema, {
			caseConversion: "camelCase",
		});

		expect(camelCaseMapping).toEqual({
			documentKey: "document_key",
			content: "content",
			index: "index",
			embedding: "embedding",
			userId: "userId",
			userName: "userName",
		});

		const noneMapping = createColumnMappingFromZod(schema, {
			caseConversion: "none",
		});

		expect(noneMapping).toEqual({
			documentKey: "document_key",
			content: "content",
			index: "index",
			embedding: "embedding",
			userId: "userId",
			userName: "userName",
		});
	});

	it("should override required columns", () => {
		const schema = z.object({
			title: z.string(),
		});

		const mapping = createColumnMappingFromZod(schema, {
			requiredColumns: {
				documentKey: "doc_key",
				content: "text_content",
			},
		});

		expect(mapping).toEqual({
			documentKey: "doc_key",
			content: "text_content",
			index: "index",
			embedding: "embedding",
			title: "title",
		});
	});

	it("should handle empty schema", () => {
		const schema = z.object({});

		const mapping = createColumnMappingFromZod(schema);

		expect(mapping).toEqual({
			documentKey: "document_key",
			content: "content",
			index: "index",
			embedding: "embedding",
		});
	});
});

describe("addTypeDiscriminator", () => {
	it("should add type discriminator to schema", () => {
		const baseSchema = z.object({
			title: z.string(),
			author: z.string(),
		});

		const schemaWithType = addTypeDiscriminator(baseSchema, "article");
		const result = schemaWithType.parse({
			title: "Test",
			author: "Author",
			type: "article",
		});

		expect(result).toEqual({
			title: "Test",
			author: "Author",
			type: "article",
		});
	});

	it("should fail with incorrect type", () => {
		const baseSchema = z.object({
			title: z.string(),
		});

		const schemaWithType = addTypeDiscriminator(baseSchema, "article");

		expect(() =>
			schemaWithType.parse({
				title: "Test",
				type: "book",
			}),
		).toThrow();
	});
});

describe("validateMetadata", () => {
	it("should validate metadata successfully", () => {
		const schema = z.object({
			title: z.string(),
			count: z.number(),
		});

		const metadata = {
			title: "Test",
			count: 42,
		};

		const result = validateMetadata(metadata, schema);
		expect(result).toEqual(metadata);
	});

	it("should throw error for invalid metadata", () => {
		const schema = z.object({
			title: z.string(),
			count: z.number(),
		});

		const metadata = {
			title: "Test",
			count: "not a number",
		};

		expect(() => validateMetadata(metadata, schema)).toThrow(
			/Metadata validation failed/,
		);
	});
});
