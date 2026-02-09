import {
	DataStoreId,
	type Generation,
	GenerationId,
	NodeId,
	type Secret,
	SecretId,
	WorkspaceId,
} from "@giselles-ai/protocol";
import { describe, expect, it, vi } from "vitest";
import type { storage } from "@/app/giselle";
import { assertGenerationResourceAccess } from "@/lib/assert-generation-resource-access";
import type {
	isDataStoreOwnedByTeam,
	isDocumentVectorStoreOwnedByTeam,
	isGitHubRepositoryIndexOwnedByTeam,
} from "@/lib/resource-ownership";
import type { getWorkspaceTeam } from "@/lib/workspaces/get-workspace-team";

let mockGetJson: typeof storage.getJson;
let mockGetWorkspaceTeamFn: typeof getWorkspaceTeam;
let mockIsDataStoreOwnedByTeam: typeof isDataStoreOwnedByTeam;
let mockIsGitHubRepositoryIndexOwnedByTeam: typeof isGitHubRepositoryIndexOwnedByTeam;
let mockIsDocumentVectorStoreOwnedByTeam: typeof isDocumentVectorStoreOwnedByTeam;

vi.mock("@/app/giselle", () => ({
	storage: {
		getJson: (...args: Parameters<typeof storage.getJson>) =>
			mockGetJson(...args),
	},
}));

vi.mock("@/lib/workspaces/get-workspace-team", () => ({
	getWorkspaceTeam: (...args: Parameters<typeof getWorkspaceTeam>) =>
		mockGetWorkspaceTeamFn(...args),
}));

vi.mock("@/lib/resource-ownership", () => ({
	isDataStoreOwnedByTeam: (
		...args: Parameters<typeof isDataStoreOwnedByTeam>
	) => mockIsDataStoreOwnedByTeam(...args),
	isGitHubRepositoryIndexOwnedByTeam: (
		...args: Parameters<typeof isGitHubRepositoryIndexOwnedByTeam>
	) => mockIsGitHubRepositoryIndexOwnedByTeam(...args),
	isDocumentVectorStoreOwnedByTeam: (
		...args: Parameters<typeof isDocumentVectorStoreOwnedByTeam>
	) => mockIsDocumentVectorStoreOwnedByTeam(...args),
}));

function mockGetWorkspaceTeam(dbId: number) {
	mockGetWorkspaceTeamFn = vi.fn().mockResolvedValue({
		id: "tm_1234567890abcdef",
		dbId,
		name: "Test Team",
		avatarUrl: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		plan: "free",
		activeSubscriptionId: null,
		activeCustomerId: null,
	});
}

const OPENAI_LLM = {
	provider: "openai",
	id: "gpt-5",
	configurations: {
		temperature: 0.7,
		topP: 1.0,
		presencePenalty: 0.0,
		frequencyPenalty: 0.0,
	},
};

describe("assertGenerationResourceAccess", () => {
	describe("secret ID validation", () => {
		it("throws error when secret has no workspaceId (fail closed)", async () => {
			const operationNodeId = NodeId.generate();
			const secretId = SecretId.generate();
			const workspaceId = WorkspaceId.generate();
			// secret has no workspaceId
			mockGetJson = vi.fn().mockResolvedValue({
				id: secretId,
				label: "test",
				value: "tok",
				createdAt: 0,
			} satisfies Secret);

			const generation = {
				id: GenerationId.generate(),
				status: "created",
				createdAt: Date.now(),
				context: {
					operationNode: {
						id: operationNodeId,
						type: "operation",
						inputs: [],
						outputs: [],
						content: {
							type: "textGeneration",
							llm: OPENAI_LLM,
							tools: {
								github: {
									tools: ["create_issue"],
									auth: { type: "secret", secretId },
								},
							},
						},
					},
					sourceNodes: [],
					connections: [],
					origin: { type: "studio", workspaceId },
				},
			} satisfies Generation;

			await expect(assertGenerationResourceAccess(generation)).rejects.toThrow(
				"access denied (fail closed)",
			);
		});

		it("throws error when secret belongs to a different workspace", async () => {
			const operationNodeId = NodeId.generate();
			const secretId = SecretId.generate();
			const workspaceId = WorkspaceId.generate();
			const differentWorkspaceId = WorkspaceId.generate();
			// secret has workspaceId
			mockGetJson = vi.fn().mockResolvedValue({
				id: secretId,
				label: "test",
				value: "tok",
				createdAt: 0,
				workspaceId: differentWorkspaceId,
			} satisfies Secret);

			const generation = {
				id: GenerationId.generate(),
				status: "created",
				createdAt: Date.now(),
				context: {
					operationNode: {
						id: operationNodeId,
						type: "operation",
						inputs: [],
						outputs: [],
						content: {
							type: "textGeneration",
							llm: OPENAI_LLM,
							tools: {
								github: {
									tools: ["create_issue"],
									auth: { type: "secret", secretId },
								},
							},
						},
					},
					sourceNodes: [],
					connections: [],
					origin: { type: "studio", workspaceId },
				},
			} satisfies Generation;

			await expect(assertGenerationResourceAccess(generation)).rejects.toThrow(
				"Secret does not belong to this workspace",
			);
		});

		it("passes when secret belongs to the same workspace (contentGeneration)", async () => {
			const operationNodeId = NodeId.generate();
			const secretId = SecretId.generate();
			const workspaceId = WorkspaceId.generate();
			// secret belongs to the same workspace
			mockGetJson = vi.fn().mockResolvedValue({
				id: secretId,
				label: "test",
				value: "tok",
				createdAt: 0,
				workspaceId,
			} satisfies Secret);

			const generation = {
				id: GenerationId.generate(),
				status: "created",
				createdAt: Date.now(),
				context: {
					operationNode: {
						id: operationNodeId,
						type: "operation",
						inputs: [],
						outputs: [],
						content: {
							type: "contentGeneration",
							version: "v1",
							languageModel: {
								provider: "openai",
								id: "gpt-5",
								configuration: {},
							},
							tools: [
								{
									name: "github:create_issue",
									configuration: { secretId },
								},
							],
							prompt: "test",
						},
					},
					sourceNodes: [],
					connections: [],
					origin: { type: "studio", workspaceId },
				},
			} satisfies Generation;

			await expect(
				assertGenerationResourceAccess(generation),
			).resolves.toBeUndefined();
		});

		it("throws error when one of multiple secrets is invalid", async () => {
			const operationNodeId = NodeId.generate();
			const secretId = SecretId.generate();
			const secretId2 = SecretId.generate();
			const workspaceId = WorkspaceId.generate();
			const differentWorkspaceId = WorkspaceId.generate();

			mockGetJson = vi
				.fn()
				// first secret belongs to the same workspace
				.mockResolvedValueOnce({
					id: secretId,
					label: "ok",
					value: "v",
					createdAt: 0,
					workspaceId,
				} satisfies Secret)
				// second secret belongs to a different workspace
				.mockResolvedValueOnce({
					id: secretId2,
					label: "bad",
					value: "v",
					createdAt: 0,
					workspaceId: differentWorkspaceId,
				} satisfies Secret);

			const generation = {
				id: GenerationId.generate(),
				status: "created",
				createdAt: Date.now(),
				context: {
					operationNode: {
						id: operationNodeId,
						type: "operation",
						inputs: [],
						outputs: [],
						content: {
							type: "textGeneration",
							llm: OPENAI_LLM,
							tools: {
								github: {
									tools: ["create_issue"],
									auth: { type: "secret", secretId },
								},
								postgres: {
									tools: ["query"],
									secretId: secretId2,
								},
							},
						},
					},
					sourceNodes: [],
					connections: [],
					origin: { type: "studio", workspaceId },
				},
			} satisfies Generation;

			await expect(assertGenerationResourceAccess(generation)).rejects.toThrow(
				"Secret does not belong to this workspace",
			);
		});
	});

	describe("team-scoped resource validation", () => {
		it("throws error when data store is not owned by team", async () => {
			const operationNodeId = NodeId.generate();
			const sourceNodeId = NodeId.generate();
			const dataStoreId = DataStoreId.generate();
			const workspaceId = WorkspaceId.generate();
			mockGetWorkspaceTeam(1);
			// data store is NOT owned by this team
			mockIsDataStoreOwnedByTeam = vi.fn().mockResolvedValue(false);

			const generation = {
				id: GenerationId.generate(),
				status: "created",
				createdAt: Date.now(),
				context: {
					operationNode: {
						id: operationNodeId,
						type: "operation",
						inputs: [],
						outputs: [],
						content: { type: "action" },
					},
					sourceNodes: [
						{
							id: sourceNodeId,
							type: "variable",
							inputs: [],
							outputs: [],
							content: {
								type: "dataStore",
								state: { status: "configured", dataStoreId },
							},
						},
					],
					connections: [],
					origin: { type: "studio", workspaceId },
				},
			} satisfies Generation;

			await expect(assertGenerationResourceAccess(generation)).rejects.toThrow(
				"Data store does not belong to this team",
			);
		});

		it("passes when data store is owned by team", async () => {
			const operationNodeId = NodeId.generate();
			const sourceNodeId = NodeId.generate();
			const dataStoreId = DataStoreId.generate();
			const workspaceId = WorkspaceId.generate();
			mockGetWorkspaceTeam(1);
			// data store is owned by this team
			mockIsDataStoreOwnedByTeam = vi.fn().mockResolvedValue(true);

			const generation = {
				id: GenerationId.generate(),
				status: "created",
				createdAt: Date.now(),
				context: {
					operationNode: {
						id: operationNodeId,
						type: "operation",
						inputs: [],
						outputs: [],
						content: { type: "action" },
					},
					sourceNodes: [
						{
							id: sourceNodeId,
							type: "variable",
							inputs: [],
							outputs: [],
							content: {
								type: "dataStore",
								state: { status: "configured", dataStoreId },
							},
						},
					],
					connections: [],
					origin: { type: "studio", workspaceId },
				},
			} satisfies Generation;

			await expect(
				assertGenerationResourceAccess(generation),
			).resolves.toBeUndefined();
		});

		it("throws error when GitHub vector store is not owned by team", async () => {
			const operationNodeId = NodeId.generate();
			const sourceNodeId = NodeId.generate();
			const workspaceId = WorkspaceId.generate();
			mockGetWorkspaceTeam(1);
			// GitHub repository index is NOT owned by this team
			mockIsGitHubRepositoryIndexOwnedByTeam = vi.fn().mockResolvedValue(false);

			const generation = {
				id: GenerationId.generate(),
				status: "created",
				createdAt: Date.now(),
				context: {
					operationNode: {
						id: operationNodeId,
						type: "operation",
						inputs: [],
						outputs: [],
						content: { type: "action" },
					},
					sourceNodes: [
						{
							id: sourceNodeId,
							type: "variable",
							inputs: [],
							outputs: [],
							content: {
								type: "vectorStore",
								source: {
									provider: "github",
									state: {
										status: "configured",
										owner: "my-org",
										repo: "my-repo",
										contentType: "blob",
									},
								},
							},
						},
					],
					connections: [],
					origin: { type: "studio", workspaceId },
				},
			} satisfies Generation;

			await expect(assertGenerationResourceAccess(generation)).rejects.toThrow(
				"GitHub vector store does not belong to this team",
			);
		});

		it("passes when GitHub vector store is owned by team", async () => {
			const operationNodeId = NodeId.generate();
			const sourceNodeId = NodeId.generate();
			const workspaceId = WorkspaceId.generate();
			mockGetWorkspaceTeam(1);
			// GitHub repository index is owned by this team
			mockIsGitHubRepositoryIndexOwnedByTeam = vi.fn().mockResolvedValue(true);

			const generation = {
				id: GenerationId.generate(),
				status: "created",
				createdAt: Date.now(),
				context: {
					operationNode: {
						id: operationNodeId,
						type: "operation",
						inputs: [],
						outputs: [],
						content: { type: "action" },
					},
					sourceNodes: [
						{
							id: sourceNodeId,
							type: "variable",
							inputs: [],
							outputs: [],
							content: {
								type: "vectorStore",
								source: {
									provider: "github",
									state: {
										status: "configured",
										owner: "my-org",
										repo: "my-repo",
										contentType: "blob",
									},
								},
							},
						},
					],
					connections: [],
					origin: { type: "studio", workspaceId },
				},
			} satisfies Generation;

			await expect(
				assertGenerationResourceAccess(generation),
			).resolves.toBeUndefined();
		});

		it("throws error when document vector store is not owned by team", async () => {
			const operationNodeId = NodeId.generate();
			const sourceNodeId = NodeId.generate();
			const workspaceId = WorkspaceId.generate();
			mockGetWorkspaceTeam(1);
			// document vector store is NOT owned by this team
			mockIsDocumentVectorStoreOwnedByTeam = vi.fn().mockResolvedValue(false);

			const generation = {
				id: GenerationId.generate(),
				status: "created",
				createdAt: Date.now(),
				context: {
					operationNode: {
						id: operationNodeId,
						type: "operation",
						inputs: [],
						outputs: [],
						content: { type: "action" },
					},
					sourceNodes: [
						{
							id: sourceNodeId,
							type: "variable",
							inputs: [],
							outputs: [],
							content: {
								type: "vectorStore",
								source: {
									provider: "document",
									state: {
										status: "configured",
										documentVectorStoreId: "dvs_test123",
									},
								},
							},
						},
					],
					connections: [],
					origin: { type: "studio", workspaceId },
				},
			} satisfies Generation;

			await expect(assertGenerationResourceAccess(generation)).rejects.toThrow(
				"Document vector store does not belong to this team",
			);
		});

		it("passes when document vector store is owned by team", async () => {
			const operationNodeId = NodeId.generate();
			const sourceNodeId = NodeId.generate();
			const workspaceId = WorkspaceId.generate();
			mockGetWorkspaceTeam(1);
			// document vector store is owned by this team
			mockIsDocumentVectorStoreOwnedByTeam = vi.fn().mockResolvedValue(true);

			const generation = {
				id: GenerationId.generate(),
				status: "created",
				createdAt: Date.now(),
				context: {
					operationNode: {
						id: operationNodeId,
						type: "operation",
						inputs: [],
						outputs: [],
						content: { type: "action" },
					},
					sourceNodes: [
						{
							id: sourceNodeId,
							type: "variable",
							inputs: [],
							outputs: [],
							content: {
								type: "vectorStore",
								source: {
									provider: "document",
									state: {
										status: "configured",
										documentVectorStoreId: "dvs_test123",
									},
								},
							},
						},
					],
					connections: [],
					origin: { type: "studio", workspaceId },
				},
			} satisfies Generation;

			await expect(
				assertGenerationResourceAccess(generation),
			).resolves.toBeUndefined();
		});

		it("skips team lookup when no team-scoped resources exist", async () => {
			const operationNodeId = NodeId.generate();
			const sourceNodeId = NodeId.generate();
			const workspaceId = WorkspaceId.generate();
			mockGetWorkspaceTeamFn = vi.fn();

			const generation = {
				id: GenerationId.generate(),
				status: "created",
				createdAt: Date.now(),
				context: {
					operationNode: {
						id: operationNodeId,
						type: "operation",
						inputs: [],
						outputs: [],
						content: { type: "action" },
					},
					sourceNodes: [
						{
							id: sourceNodeId,
							type: "variable",
							inputs: [],
							outputs: [],
							content: { type: "text" },
						},
					],
					connections: [],
					origin: { type: "studio", workspaceId },
				},
			} satisfies Generation;

			await expect(
				assertGenerationResourceAccess(generation),
			).resolves.toBeUndefined();

			expect(mockGetWorkspaceTeamFn).not.toHaveBeenCalled();
		});
	});

	describe("happy paths", () => {
		it("passes for a generation with no resources at all", async () => {
			const operationNodeId = NodeId.generate();
			const workspaceId = WorkspaceId.generate();

			await expect(
				assertGenerationResourceAccess({
					id: GenerationId.generate(),
					status: "created",
					createdAt: Date.now(),
					context: {
						operationNode: {
							id: operationNodeId,
							type: "operation",
							content: { type: "action" },
							inputs: [],
							outputs: [],
						},
						sourceNodes: [],
						connections: [],
						origin: { type: "studio", workspaceId },
					},
				} satisfies Generation),
			).resolves.toBeUndefined();
		});

		it("passes when all resources are valid", async () => {
			const operationNodeId = NodeId.generate();
			const sourceNodeId = NodeId.generate();
			const sourceNodeId2 = NodeId.generate();
			const secretId = SecretId.generate();
			const dataStoreId = DataStoreId.generate();
			const workspaceId = WorkspaceId.generate();
			mockGetWorkspaceTeam(1);

			// secret belongs to the same workspace
			mockGetJson = vi.fn().mockResolvedValue({
				id: secretId,
				label: "ok",
				value: "v",
				createdAt: 0,
				workspaceId,
			} satisfies Secret);

			// all team-scoped resources are owned by this team
			mockIsDataStoreOwnedByTeam = vi.fn().mockResolvedValue(true);
			mockIsGitHubRepositoryIndexOwnedByTeam = vi.fn().mockResolvedValue(true);

			const generation = {
				id: GenerationId.generate(),
				status: "created",
				createdAt: Date.now(),
				context: {
					operationNode: {
						id: operationNodeId,
						type: "operation",
						inputs: [],
						outputs: [],
						content: {
							type: "textGeneration",
							llm: OPENAI_LLM,
							tools: {
								github: {
									tools: ["create_issue"],
									auth: { type: "secret", secretId },
								},
							},
						},
					},
					sourceNodes: [
						{
							id: sourceNodeId,
							type: "variable",
							inputs: [],
							outputs: [],
							content: {
								type: "dataStore",
								state: { status: "configured", dataStoreId },
							},
						},
						{
							id: sourceNodeId2,
							type: "variable",
							inputs: [],
							outputs: [],
							content: {
								type: "vectorStore",
								source: {
									provider: "github",
									state: {
										status: "configured",
										owner: "my-org",
										repo: "my-repo",
										contentType: "blob",
									},
								},
							},
						},
					],
					connections: [],
					origin: { type: "studio", workspaceId },
				},
			} satisfies Generation;

			await expect(
				assertGenerationResourceAccess(generation),
			).resolves.toBeUndefined();
		});
	});
});
