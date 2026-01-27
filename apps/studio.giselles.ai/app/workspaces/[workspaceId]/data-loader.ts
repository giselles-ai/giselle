import type { WorkspaceId } from "@giselles-ai/protocol";
import { notFound } from "next/navigation";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import {
	aiGatewayFlag,
	aiGatewayUnsupportedModelsFlag,
	dataStoreFlag,
	generateContentNodeFlag,
	googleUrlContextFlag,
	layoutV3Flag,
	privatePreviewToolsFlag,
	webSearchActionFlag,
} from "@/flags";
import { getTeamDataStores } from "@/lib/data-stores/actions";
import { logger } from "@/lib/logger";
import {
	getDocumentVectorStores,
	getOfficialDocumentVectorStores,
} from "@/lib/vector-stores/document/queries";
import {
	getGitHubRepositoryIndexes,
	getOfficialGitHubRepositoryIndexes,
} from "@/lib/vector-stores/github";
import { getGitHubIntegrationState } from "@/packages/lib/github";
import { getUsageLimitsForTeam } from "@/packages/lib/usage-limits";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchWorkspaceTeam, isMemberOfTeam } from "@/services/teams";
import { isInternalPlan } from "@/services/teams/utils";

export async function dataLoader(workspaceId: WorkspaceId) {
	logger.debug("Loading workspace");
	const agent = await db.query.agents.findFirst({
		where: (agents, { eq }) => eq(agents.workspaceId, workspaceId),
	});
	if (agent === undefined) {
		return notFound();
	}
	const currentUser = await fetchCurrentUser();

	// Check if user is a member of the workspace's team before other operations
	const isUserMemberOfWorkspaceTeam = await isMemberOfTeam(
		currentUser.dbId,
		agent.teamDbId,
	);
	if (!isUserMemberOfWorkspaceTeam) {
		return notFound();
	}

	const gitHubIntegrationState = await getGitHubIntegrationState(agent.dbId);

	const workspaceTeam = await fetchWorkspaceTeam(agent.teamDbId);
	if (!workspaceTeam) {
		return notFound();
	}

	const sdkAvailability = isInternalPlan(workspaceTeam);
	const usageLimits = await getUsageLimitsForTeam(workspaceTeam);
	const webSearchAction = await webSearchActionFlag();
	const layoutV3 = await layoutV3Flag();
	const stage = true;
	const aiGateway = await aiGatewayFlag();
	const aiGatewayUnsupportedModels = await aiGatewayUnsupportedModelsFlag();
	const googleUrlContext = await googleUrlContextFlag();
	const data = await giselle.getWorkspace(workspaceId);
	const generateContentNode = await generateContentNodeFlag();
	const privatePreviewTools = await privatePreviewToolsFlag();
	const dataStore = await dataStoreFlag();
	const [teamGitHubRepositoryIndexes, officialGitHubRepositoryIndexes] =
		await Promise.all([
			getGitHubRepositoryIndexes(workspaceTeam.dbId),
			getOfficialGitHubRepositoryIndexes(),
		]);

	const officialGitHubIds = new Set(
		officialGitHubRepositoryIndexes.map((r) => r.id),
	);
	const teamGitHubIds = new Set(teamGitHubRepositoryIndexes.map((r) => r.id));
	const gitHubRepositoryIndexes = [
		...teamGitHubRepositoryIndexes.map((repo) => ({
			...repo,
			isOfficial: officialGitHubIds.has(repo.id),
		})),
		...officialGitHubRepositoryIndexes
			.filter((repo) => !teamGitHubIds.has(repo.id))
			.map((repo) => ({ ...repo, isOfficial: true })),
	];

	const [teamDocumentStores, officialDocumentStores, teamDataStores] =
		await Promise.all([
			getDocumentVectorStores(workspaceTeam.dbId),
			getOfficialDocumentVectorStores(),
			getTeamDataStores(workspaceTeam.dbId),
		]);

	// Merge stores with isOfficial flag, deduplicating official stores already in team stores
	const officialStoreIds = new Set(officialDocumentStores.map((s) => s.id));
	const teamStoreIds = new Set(teamDocumentStores.map((s) => s.id));
	const documentVectorStores = [
		...teamDocumentStores.map((store) => ({
			...store,
			isOfficial: officialStoreIds.has(store.id),
		})),
		...officialDocumentStores
			.filter((store) => !teamStoreIds.has(store.id))
			.map((store) => ({ ...store, isOfficial: true })),
	];

	const llmProviders = giselle.getLanguageModelProviders();

	return {
		currentUser,
		agent,
		gitHubIntegrationState,
		workspaceTeam,
		usageLimits,
		gitHubRepositoryIndexes,
		webSearchAction,
		layoutV3,
		stage,
		aiGateway,
		aiGatewayUnsupportedModels,
		googleUrlContext,
		data,
		documentVectorStores,
		teamDataStores,
		featureFlags: {
			webSearchAction,
			layoutV3,
			stage,
			aiGateway,
			aiGatewayUnsupportedModels,
			googleUrlContext,
			generateContentNode,
			privatePreviewTools,
			dataStore,
			sdkAvailability,
		},
		llmProviders,
	};
}

export type LoaderData = Awaited<ReturnType<typeof dataLoader>>;
