import type { WorkspaceId } from "@giselles-ai/protocol";
import { notFound } from "next/navigation";
import { giselleEngine } from "@/app/giselle-engine";
import { db } from "@/db";
import {
	aiGatewayFlag,
	docVectorStoreFlag,
	githubIssuesVectorStoreFlag,
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
	const googleUrlContext = await googleUrlContextFlag();
	const data = await giselleEngine.getWorkspace(workspaceId);
	const documentVectorStore = await docVectorStoreFlag();
	const documentVectorStores = documentVectorStore
		? await getDocumentVectorStores(workspaceTeam.dbId)
		: [];
	const githubIssuesVectorStore = await githubIssuesVectorStoreFlag();

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
		googleUrlContext,
		data,
		documentVectorStore,
		documentVectorStores,
		featureFlags: {
			webSearchAction,
			layoutV3,
			stage,
			aiGateway,
			googleUrlContext,
			documentVectorStore,
			githubIssuesVectorStore,
		},
	};
}

export type LoaderData = Awaited<ReturnType<typeof dataLoader>>;
