import {
	ContentGenerationContent,
	DataStoreContent,
	type DataStoreId,
	type Generation,
	Secret,
	SecretId,
	TextGenerationContent,
	VectorStoreContent,
} from "@giselles-ai/protocol";
import { storage } from "@/app/giselle";
import {
	isDataStoreOwnedByTeam,
	isDocumentVectorStoreOwnedByTeam,
	isGitHubRepositoryIndexOwnedByTeam,
} from "@/lib/resource-ownership";
import { getWorkspaceTeam } from "@/lib/workspaces/get-workspace-team";
import type { DocumentVectorStoreId } from "@/packages/types";

/**
 * Validates that all resource references (secrets, data stores,
 * vector stores) inside a generation context belong to the workspace / team
 * that owns the generation.
 * Call this **after** `assertWorkspaceAccess` so we know the caller may access
 * the workspace — this function prevents cross-workspace resource injection.
 */
export async function assertGenerationResourceAccess(generation: Generation) {
	const workspaceId = generation.context.origin.workspaceId;

	// 1. Secret-ID validation
	const secretIds = extractSecretIds(generation);
	const secrets = await Promise.all(
		secretIds.map((secretId) =>
			storage
				.getJson({
					path: `secrets/${secretId}/secret.json`,
					schema: Secret,
				})
				.catch(() => {
					throw new Error(`Secret ${secretId} not found — access denied`);
				}),
		),
	);
	for (const secret of secrets) {
		if (!secret.workspaceId) {
			throw new Error(
				`Secret ${secret.id} has no workspaceId — access denied (fail closed)`,
			);
		}
		if (secret.workspaceId !== workspaceId) {
			throw new Error("Secret does not belong to this workspace");
		}
	}

	// 2. Team-scoped resource validation (dataStore, vectorStore)
	const sourceNodeResources = extractSourceNodeResources(generation);
	const hasResources =
		sourceNodeResources.dataStoreIds.length > 0 ||
		sourceNodeResources.githubVectorStores.length > 0 ||
		sourceNodeResources.documentVectorStoreIds.length > 0;
	if (!hasResources) return;

	const team = await getWorkspaceTeam(workspaceId);

	await Promise.all([
		...sourceNodeResources.dataStoreIds.map(async (dataStoreId) => {
			if (!(await isDataStoreOwnedByTeam(dataStoreId, team.dbId))) {
				throw new Error("Data store does not belong to this team");
			}
		}),
		...sourceNodeResources.githubVectorStores.map(async (gh) => {
			if (
				!(await isGitHubRepositoryIndexOwnedByTeam(
					gh.owner,
					gh.repo,
					team.dbId,
				))
			) {
				throw new Error("GitHub vector store does not belong to this team");
			}
		}),
		...sourceNodeResources.documentVectorStoreIds.map(async (docVsId) => {
			if (!(await isDocumentVectorStoreOwnedByTeam(docVsId, team.dbId))) {
				throw new Error("Document vector store does not belong to this team");
			}
		}),
	]);
}

function extractSecretIds(generation: Generation): SecretId[] {
	const ids: SecretId[] = [];
	const rawContent = generation.context.operationNode.content;

	// OperationNodeLike has a loose content type; parse with strict schemas
	// to safely extract secretIds.
	const textGen = TextGenerationContent.safeParse(rawContent);
	if (textGen.success) {
		const content = textGen.data;
		if (
			content.tools?.github?.auth.type === "secret" &&
			content.tools.github.auth.secretId
		) {
			ids.push(content.tools.github.auth.secretId);
		}
		if (content.tools?.postgres?.secretId) {
			ids.push(content.tools.postgres.secretId);
		}
		return ids;
	}

	const contentGen = ContentGenerationContent.safeParse(rawContent);
	if (contentGen.success) {
		for (const tool of contentGen.data.tools) {
			for (const value of Object.values(tool.configuration)) {
				const parsed = SecretId.safeParse(value);
				if (parsed.success) {
					ids.push(parsed.data);
				}
			}
		}
		return ids;
	}

	return ids;
}

interface SourceNodeResources {
	dataStoreIds: DataStoreId[];
	githubVectorStores: { owner: string; repo: string }[];
	documentVectorStoreIds: DocumentVectorStoreId[];
}

function extractSourceNodeResources(
	generation: Generation,
): SourceNodeResources {
	const resources: SourceNodeResources = {
		dataStoreIds: [],
		githubVectorStores: [],
		documentVectorStoreIds: [],
	};

	for (const node of generation.context.sourceNodes) {
		const dataStore = DataStoreContent.safeParse(node.content);
		if (dataStore.success && dataStore.data.state.status === "configured") {
			resources.dataStoreIds.push(dataStore.data.state.dataStoreId);
			continue;
		}

		const vectorStore = VectorStoreContent.safeParse(node.content);
		if (vectorStore.success) {
			const source = vectorStore.data.source;
			if (
				source.provider === "github" &&
				source.state.status === "configured"
			) {
				resources.githubVectorStores.push({
					owner: source.state.owner,
					repo: source.state.repo,
				});
			} else if (
				source.provider === "document" &&
				source.state.status === "configured"
			) {
				const id = source.state.documentVectorStoreId;
				if (!id.startsWith("dvs_")) {
					throw new Error("Invalid document vector store ID format");
				}
				resources.documentVectorStoreIds.push(id as DocumentVectorStoreId);
			}
		}
	}
	return resources;
}
