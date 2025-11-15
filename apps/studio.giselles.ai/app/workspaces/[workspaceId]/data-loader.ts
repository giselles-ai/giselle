import type { WorkspaceId } from "@giselles-ai/protocol";
import { notFound } from "next/navigation";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import {
	aiGatewayFlag,
	aiGatewayUnsupportedModelsFlag,
	googleUrlContextFlag,
	layoutV3Flag,
	stageFlag,
	webSearchActionFlag,
} from "@/flags";
import { logger } from "@/lib/logger";
import { getDocumentVectorStores } from "@/lib/vector-stores/document/queries";
import { getGitHubRepositoryIndexes } from "@/lib/vector-stores/github";
import { getGitHubIntegrationState } from "@/packages/lib/github";
import { getUsageLimitsForTeam } from "@/packages/lib/usage-limits";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchWorkspaceTeam, isMemberOfTeam } from "@/services/teams";

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

	const usageLimits = await getUsageLimitsForTeam(workspaceTeam);
	const gitHubRepositoryIndexes = await getGitHubRepositoryIndexes(
		workspaceTeam.dbId,
	);
	const webSearchAction = await webSearchActionFlag();
	const layoutV3 = await layoutV3Flag();
	const stage = await stageFlag();
	const aiGateway = await aiGatewayFlag();
	const aiGatewayUnsupportedModels = await aiGatewayUnsupportedModelsFlag();
	const googleUrlContext = await googleUrlContextFlag();
	const data = await giselle.getWorkspace(workspaceId);
	const documentVectorStores = await getDocumentVectorStores(
		workspaceTeam.dbId,
	);

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
		featureFlags: {
			webSearchAction,
			layoutV3,
			stage,
			aiGateway,
			aiGatewayUnsupportedModels,
			googleUrlContext,
		},
	};
}

export type LoaderData = Awaited<ReturnType<typeof dataLoader>>;
