import * as pgvector from "pgvector/pg";
import { describe, expect, it } from "vitest";

describe("pgvector integration", () => {
	it("should convert embeddings to SQL format", () => {
		const embedding = [1.0, 2.0, 3.0];
		const sql = pgvector.toSql(embedding);
		expect(sql).toBe("[1,2,3]");
	});

	it("should handle empty embeddings", () => {
		const embedding: number[] = [];
		const sql = pgvector.toSql(embedding);
		expect(sql).toBe("[]");
	});

	it("should handle large embeddings", () => {
		const embedding = new Array(1536).fill(0.5);
		const sql = pgvector.toSql(embedding);
		expect(sql).toMatch(/^\[0\.5(,0\.5)*\]$/);
		expect(sql.split(",").length).toBe(1536);
	});
});
