import { describe, expect, it, vi } from "vitest";
import { queryGithubVectorStore } from "./query-github-vector-store";

// Mock drizzle and database
vi.mock("@/drizzle", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				innerJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(() => Promise.resolve([])),
					})),
				})),
			})),
		})),
	},
	teams: { dbId: "teams_dbId" },
	agents: { workspaceId: "agents_workspaceId", teamDbId: "agents_teamDbId" },
	githubRepositoryIndex: {
		dbId: "githubRepositoryIndex_dbId",
		teamDbId: "githubRepositoryIndex_teamDbId",
		owner: "githubRepositoryIndex_owner",
		repo: "githubRepositoryIndex_repo",
	},
	githubRepositoryEmbeddings: {},
}));

vi.mock("drizzle-orm", () => ({
	eq: vi.fn(),
	and: vi.fn(),
	gte: vi.fn(),
	desc: vi.fn(),
	sql: vi.fn(),
	cosineDistance: vi.fn(),
}));

describe("queryGithubVectorStore", () => {
	const validParams = {
		embedding: [0.1, 0.2, 0.3],
		limit: 10,
		similarityThreshold: 0.5,
		filters: {
			workspaceId: "test-workspace",
			owner: "test-owner",
			repo: "test-repo",
		},
	};

	it("should validate workspaceId parameter", async () => {
		await expect(
			queryGithubVectorStore({
				...validParams,
				filters: {
					...validParams.filters,
					workspaceId: "",
				},
			}),
		).rejects.toThrow("Invalid workspaceId: must be a non-empty string");

		await expect(
			queryGithubVectorStore({
				...validParams,
				filters: {
					...validParams.filters,
					workspaceId: null as any,
				},
			}),
		).rejects.toThrow("Invalid workspaceId: must be a non-empty string");
	});

	it("should validate owner parameter", async () => {
		await expect(
			queryGithubVectorStore({
				...validParams,
				filters: {
					...validParams.filters,
					owner: "",
				},
			}),
		).rejects.toThrow("Invalid owner: must be a non-empty string");

		await expect(
			queryGithubVectorStore({
				...validParams,
				filters: {
					...validParams.filters,
					owner: "   ",
				},
			}),
		).rejects.toThrow("Invalid owner: must be a non-empty string");
	});

	it("should validate repo parameter", async () => {
		await expect(
			queryGithubVectorStore({
				...validParams,
				filters: {
					...validParams.filters,
					repo: "",
				},
			}),
		).rejects.toThrow("Invalid repo: must be a non-empty string");
	});

	it("should validate embedding parameter", async () => {
		await expect(
			queryGithubVectorStore({
				...validParams,
				embedding: [],
			}),
		).rejects.toThrow("Invalid embedding: must be a non-empty array");

		await expect(
			queryGithubVectorStore({
				...validParams,
				embedding: null as any,
			}),
		).rejects.toThrow("Invalid embedding: must be a non-empty array");
	});

	it("should validate limit parameter", async () => {
		await expect(
			queryGithubVectorStore({
				...validParams,
				limit: 0,
			}),
		).rejects.toThrow("Invalid limit: must be a positive number");

		await expect(
			queryGithubVectorStore({
				...validParams,
				limit: -1,
			}),
		).rejects.toThrow("Invalid limit: must be a positive number");
	});

	it("should throw error when team or repository index not found", async () => {
		await expect(queryGithubVectorStore(validParams)).rejects.toThrow(
			"Team or repository index not found",
		);
	});
});