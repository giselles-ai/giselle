/**
 * RAG3 Usage Examples
 *
 * This file demonstrates various ways to use RAG3 in real applications.
 * These examples show the progression from simple to advanced usage.
 */

import { z } from "zod/v4";
import {
	type DatabaseError,
	type ValidationError,
	createChunkStore,
	createDocumentRAG,
	createGitHubRAG,
	createQueryService,
	handleError,
	isErrorCategory,
} from "../index";

// Mock embedder for examples
const mockEmbedder = {
	embed: async (text: string) => {
		// In real usage, this would call OpenAI, Cohere, etc.
		return new Array(1536).fill(0).map(() => Math.random());
	},
	embedBatch: async (texts: string[]) => {
		// In real usage, this would call OpenAI, Cohere, etc.
		return texts.map(() => new Array(1536).fill(0).map(() => Math.random()));
	},
};

/**
 * Example 1: Simplest possible usage
 */
export async function simpleExample() {
	// Minimal setup with no metadata
	const store = createChunkStore({
		database: {
			connectionString: process.env.DATABASE_URL!,
		},
		tableName: "simple_chunks",
	});

	const queryService = createQueryService({
		database: {
			connectionString: process.env.DATABASE_URL!,
		},
		tableName: "simple_chunks",
		embedder: mockEmbedder,
		contextToFilter: () => ({}), // No filtering
	});

	// Insert some content
	await store.insert(
		"doc1",
		[
			{
				content: "This is a simple document.",
				index: 0,
				embedding: await mockEmbedder.embed("This is a simple document."),
			},
		],
		{},
	); // Empty metadata

	// Search
	const results = await queryService.search("simple document", {});
	console.log(results);
}

/**
 * Example 2: Using document preset for a knowledge base
 */
export async function documentKnowledgeBase() {
	const { store, queryService } = createDocumentRAG({
		database: {
			connectionString: process.env.DATABASE_URL!,
		},
		tableName: "knowledge_base",
		embedder: mockEmbedder,
		contextToFilter: (context: { workspaceId?: string; userId?: string }) => {
			const filters: Record<string, unknown> = {};
			if (context.workspaceId) filters.workspace_id = context.workspaceId;
			if (context.userId) filters.user_id = context.userId;
			return filters;
		},
	});

	// Insert a document with rich metadata
	const documentMetadata = {
		title: "Getting Started with TypeScript",
		author: "Jane Developer",
		createdAt: new Date("2024-01-15"),
		updatedAt: new Date("2024-01-20"),
		tags: ["typescript", "programming", "tutorial"],
		description: "A comprehensive guide to TypeScript basics",
	};

	const chunks = [
		{
			content:
				"TypeScript is a strongly typed programming language that builds on JavaScript.",
			index: 0,
			embedding: await mockEmbedder.embed(
				"TypeScript is a strongly typed programming language",
			),
		},
		{
			content: "TypeScript adds static type definitions to JavaScript.",
			index: 1,
			embedding: await mockEmbedder.embed(
				"TypeScript adds static type definitions",
			),
		},
	];

	await store.insert("typescript-guide", chunks, documentMetadata);

	// Search with workspace context
	const results = await queryService.search(
		"what is typescript",
		{ workspaceId: "workspace-123" },
		5,
	);

	// Results include full metadata with type safety
	results.forEach((result) => {
		console.log(
			`Found in "${result.metadata.title}" by ${result.metadata.author}`,
		);
		console.log(`Tags: ${result.metadata.tags.join(", ")}`);
	});
}

/**
 * Example 3: GitHub code repository RAG
 */
export async function githubCodeRAG() {
	const { store, queryService } = createGitHubRAG({
		database: {
			connectionString: process.env.DATABASE_URL!,
		},
		tableName: "github_code",
		embedder: mockEmbedder,
		contextToFilter: (context: {
			owner?: string;
			repo?: string;
			branch?: string;
		}) => {
			const filters: Record<string, unknown> = {};
			if (context.owner) filters.owner = context.owner;
			if (context.repo) filters.repo = context.repo;
			if (context.branch) filters.branch = context.branch;
			return filters;
		},
	});

	// Index a TypeScript file
	const fileMetadata = {
		owner: "microsoft",
		repo: "TypeScript",
		path: "src/compiler/parser.ts",
		sha: "abc123def456",
		type: "file" as const,
		size: 15420,
		lastModified: new Date(),
		branch: "main",
	};

	const codeChunks = [
		{
			content:
				"function parseSourceFile(fileName: string, sourceText: string): SourceFile {",
			index: 0,
			embedding: await mockEmbedder.embed("parseSourceFile function"),
		},
		{
			content:
				"interface SourceFile extends Node { fileName: string; text: string; }",
			index: 1,
			embedding: await mockEmbedder.embed("SourceFile interface"),
		},
	];

	await store.insert("parser.ts", codeChunks, fileMetadata);

	// Search within specific repository
	const results = await queryService.search(
		"how to parse source file",
		{ owner: "microsoft", repo: "TypeScript" },
		3,
	);

	results.forEach((result) => {
		console.log(`Found in ${result.metadata.owner}/${result.metadata.repo}`);
		console.log(`File: ${result.metadata.path} (${result.metadata.sha})`);
	});
}

/**
 * Example 4: Custom metadata schema with validation
 */
export async function customMetadataExample() {
	// Define a custom schema for e-commerce products
	const ProductMetadataSchema = z.object({
		productId: z.string(),
		category: z.enum(["electronics", "clothing", "books", "home"]),
		price: z.number().positive(),
		brand: z.string(),
		inStock: z.boolean(),
		tags: z.array(z.string()),
		rating: z.number().min(0).max(5).optional(),
		reviews: z.number().int().nonnegative().default(0),
	});

	type ProductMetadata = z.infer<typeof ProductMetadataSchema>;

	const store = createChunkStore({
		database: {
			connectionString: process.env.DATABASE_URL!,
		},
		tableName: "product_descriptions",
		metadataSchema: ProductMetadataSchema,
	});

	const queryService = createQueryService({
		database: {
			connectionString: process.env.DATABASE_URL!,
		},
		tableName: "product_descriptions",
		embedder: mockEmbedder,
		metadataSchema: ProductMetadataSchema,
		contextToFilter: (context: { category?: string; maxPrice?: number }) => {
			const filters: Record<string, unknown> = {};
			if (context.category) filters.category = context.category;
			if (context.maxPrice) filters.price = { $lte: context.maxPrice };
			return filters;
		},
	});

	// Insert product with validated metadata
	const productMetadata: ProductMetadata = {
		productId: "laptop-001",
		category: "electronics",
		price: 999.99,
		brand: "TechCorp",
		inStock: true,
		tags: ["laptop", "gaming", "rgb"],
		rating: 4.5,
		reviews: 42,
	};

	await store.insert(
		"laptop-001",
		[
			{
				content:
					"High-performance gaming laptop with RGB keyboard and advanced cooling system.",
				index: 0,
				embedding: await mockEmbedder.embed(
					"gaming laptop RGB keyboard cooling",
				),
			},
		],
		productMetadata,
	);

	// Type-safe search with metadata filtering
	const results = await queryService.search("gaming laptop", {
		category: "electronics",
		maxPrice: 1500,
	});

	// TypeScript knows the exact shape of metadata
	results.forEach((result) => {
		console.log(`${result.metadata.brand} - $${result.metadata.price}`);
		console.log(
			`Rating: ${result.metadata.rating}/5 (${result.metadata.reviews} reviews)`,
		);
		console.log(`In stock: ${result.metadata.inStock}`);
	});
}

/**
 * Example 5: Advanced error handling
 */
export async function errorHandlingExample() {
	try {
		// This will fail due to invalid configuration
		const store = createChunkStore({
			database: {
				connectionString: "", // Invalid: empty string
				poolConfig: {
					max: -1, // Invalid: negative value
				},
			},
			tableName: "test",
		});

		await store.insert("doc1", [], {});
	} catch (error) {
		// Type-safe error handling
		if (isErrorCategory(error, "validation")) {
			console.log("Validation Error Details:");
			if (error instanceof ValidationError) {
				error.validationDetails.forEach((detail) => {
					console.log(`  ${detail.path}: ${detail.message}`);
				});
			}
		} else if (isErrorCategory(error, "database")) {
			console.log(`Database Error: ${error.code}`);
			console.log(`Context:`, error.context);
		}

		// Alternative: structured error handling
		handleError(error, {
			VALIDATION_FAILED: (validationError) => {
				console.log("Configuration validation failed");
				if (validationError instanceof ValidationError) {
					console.log(validationError.validationDetails);
				}
			},
			CONNECTION_FAILED: (dbError) => {
				console.log("Failed to connect to database");
				console.log("Host:", dbError.context?.host);
			},
			default: (unknownError) => {
				console.log("Unexpected error:", unknownError);
			},
		});
	}
}

/**
 * Example 6: Batch operations with error handling
 */
export async function batchOperationsExample() {
	const store = createChunkStore({
		database: {
			connectionString: process.env.DATABASE_URL!,
		},
		tableName: "batch_test",
		preset: "simple",
	});

	const documents = [
		{ key: "doc1", content: "First document content" },
		{ key: "doc2", content: "Second document content" },
		{ key: "doc3", content: "Third document content" },
	];

	// Process documents with individual error handling
	const results = await Promise.allSettled(
		documents.map(async (doc) => {
			try {
				const chunks = [
					{
						content: doc.content,
						index: 0,
						embedding: await mockEmbedder.embed(doc.content),
					},
				];

				await store.insert(doc.key, chunks, {
					source: "batch_import",
					type: "document",
					timestamp: new Date(),
				});

				return { success: true, documentKey: doc.key };
			} catch (error) {
				return {
					success: false,
					documentKey: doc.key,
					error: error instanceof Error ? error.message : "Unknown error",
				};
			}
		}),
	);

	// Report results
	const successful = results.filter(
		(r) => r.status === "fulfilled" && r.value.success,
	);
	const failed = results.filter(
		(r) => r.status === "fulfilled" && !r.value.success,
	);

	console.log(`Successfully processed: ${successful.length} documents`);
	console.log(`Failed to process: ${failed.length} documents`);

	failed.forEach((result) => {
		if (result.status === "fulfilled") {
			console.log(
				`Failed: ${result.value.documentKey} - ${result.value.error}`,
			);
		}
	});
}

/**
 * Example 7: Real-world application integration
 */
export class DocumentService {
	private store: ReturnType<typeof createChunkStore>;
	private queryService: ReturnType<typeof createQueryService>;

	constructor(
		databaseUrl: string,
		embedder: {
			embed: (text: string) => Promise<number[]>;
			embedBatch: (texts: string[]) => Promise<number[][]>;
		},
	) {
		const { store, queryService } = createDocumentRAG({
			database: { connectionString: databaseUrl },
			tableName: "documents",
			embedder,
			contextToFilter: (context: { workspaceId?: string; userId?: string }) => {
				const filters: Record<string, unknown> = {};
				if (context.workspaceId) filters.workspace_id = context.workspaceId;
				if (context.userId) filters.user_id = context.userId;
				return filters;
			},
		});

		this.store = store;
		this.queryService = queryService;
	}

	async addDocument(
		documentKey: string,
		content: string,
		metadata: {
			title: string;
			author?: string;
			tags: string[];
			workspaceId: string;
			userId?: string;
		},
	) {
		try {
			// Simple chunking strategy (in practice, use a more sophisticated chunker)
			const sentences = content
				.split(/[.!?]+/)
				.filter((s) => s.trim().length > 0);
			const chunks = await Promise.all(
				sentences.map(async (sentence, index) => ({
					content: sentence.trim(),
					index,
					embedding:
						(await this.store.constructor.length) > 0
							? new Array(1536)
									.fill(0)
									.map(() => Math.random()) // Mock for example
							: await (this.store as any).embedder.embed(sentence.trim()),
				})),
			);

			await this.store.insert(documentKey, chunks, {
				title: metadata.title,
				author: metadata.author,
				createdAt: new Date(),
				tags: metadata.tags,
				description: content.substring(0, 200) + "...",
			});

			return { success: true };
		} catch (error) {
			if (isErrorCategory(error, "validation")) {
				throw new Error(
					`Invalid document metadata: ${error.validationDetails.map((d) => d.message).join(", ")}`,
				);
			}
			if (isErrorCategory(error, "database")) {
				throw new Error(`Failed to store document: ${error.message}`);
			}
			throw error;
		}
	}

	async searchDocuments(
		query: string,
		context: { workspaceId: string; userId?: string },
		limit = 10,
	) {
		try {
			const results = await this.queryService.search(query, context, limit);

			return results.map((result) => ({
				content: result.chunk.content,
				score: result.similarity,
				metadata: {
					title: result.metadata.title,
					author: result.metadata.author,
					tags: result.metadata.tags,
					createdAt: result.metadata.createdAt,
				},
			}));
		} catch (error) {
			if (isErrorCategory(error, "embedding")) {
				throw new Error(`Failed to generate query embedding: ${error.message}`);
			}
			if (isErrorCategory(error, "database")) {
				throw new Error(`Search failed: ${error.message}`);
			}
			throw error;
		}
	}

	async deleteDocument(documentKey: string) {
		try {
			await this.store.deleteByDocumentKey(documentKey);
			return { success: true };
		} catch (error) {
			if (isErrorCategory(error, "database")) {
				throw new Error(`Failed to delete document: ${error.message}`);
			}
			throw error;
		}
	}
}

// Example usage of the service
async function useDocumentService() {
	const service = new DocumentService(process.env.DATABASE_URL!, mockEmbedder);

	// Add a document
	await service.addDocument(
		"getting-started-guide",
		"This is a comprehensive guide to getting started with our platform. It covers all the basic concepts you need to know.",
		{
			title: "Getting Started Guide",
			author: "Documentation Team",
			tags: ["guide", "tutorial", "basics"],
			workspaceId: "workspace-123",
			userId: "user-456",
		},
	);

	// Search for documents
	const results = await service.searchDocuments("how to get started", {
		workspaceId: "workspace-123",
	});

	console.log("Search results:", results);
}
