import { WorkspaceId } from "@giselle-sdk/data-type";
import {
	WorkspaceProvider,
	ZustandBridgeProvider,
} from "@giselle-sdk/giselle/react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { giselleEngine } from "@/app/giselle-engine";
import { db, flowTriggers } from "@/drizzle";
import {
	aiGatewayFlag,
	docVectorStoreFlag,
	experimental_storageFlag,
	googleUrlContextFlag,
	layoutV3Flag,
	resumableGenerationFlag,
	stageFlag,
	webSearchActionFlag,
} from "@/flags";
import { logger } from "@/lib/logger";
import { getDocumentVectorStores } from "@/lib/vector-stores/document/queries";
import { getGitHubRepositoryIndexes } from "@/lib/vector-stores/github";
import { getGitHubIntegrationState } from "@/packages/lib/github";
import { getUsageLimitsForTeam } from "@/packages/lib/usage-limits";
import { fetchCurrentUser } from "@/services/accounts";
import {
	fetchWorkspaceTeam,
	isMemberOfTeam,
	isProPlan,
} from "@/services/teams";

export const dynamic = "force-dynamic";

export default async function Layout({
	params,
	children,
}: {
	params: Promise<{ workspaceId: string }>;
	children: ReactNode;
}) {
	const { data: workspaceId, success } = WorkspaceId.safeParse(
		(await params).workspaceId,
	);
	if (!success) {
		logger.debug({ workspaceId }, "WorkspaceId validation failed");
		return notFound();
	}
	const headerList = await headers();
	const requestId = headerList.get("x-vercel-id");

	logger.debug({ workspaceId, requestId }, "WorkspaceId validation passed");
	const agent = await db.query.agents.findFirst({
		where: (agents, { eq }) => eq(agents.workspaceId, workspaceId),
	});
	if (agent === undefined) {
		return notFound();
	}
	logger.debug({ workspaceId, requestId, agent });
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
	const experimental_storage = await experimental_storageFlag();
	const stage = await stageFlag();
	const aiGateway = await aiGatewayFlag();
	const resumableGeneration = await resumableGenerationFlag();
	const googleUrlContext = await googleUrlContextFlag();
	logger.debug(
		{
			requestId,
			workspaceId,
		},
		"will get workspace",
	);
	const data = await giselleEngine.getWorkspace(
		workspaceId,
		experimental_storage,
	);

	logger.debug(
		{
			requestId,
			workspaceId,
			data,
		},
		" get workspace",
	);
	const documentVectorStore = await docVectorStoreFlag();
	const documentVectorStores = documentVectorStore
		? await getDocumentVectorStores(workspaceTeam.dbId)
		: [];

	// return children
	return (
		<WorkspaceProvider
			// TODO: Make it reference the same timeout setting as in trigger.config.ts
			generationTimeout={3600 * 1000}
			integration={{
				value: {
					github: gitHubIntegrationState,
				},
				refresh: async () => {
					"use server";
					return { github: await getGitHubIntegrationState(agent.dbId) };
				},
			}}
			vectorStore={{
				githubRepositoryIndexes: gitHubRepositoryIndexes,
				documentSettingPath: "/settings/team/vector-stores/document",
				githubSettingPath: "/settings/team/vector-stores",
				documentStores: documentVectorStores.map((store) => ({
					id: store.id,
					name: store.name,
					embeddingProfileIds: store.embeddingProfileIds,
					sources: store.sources.map((source) => ({
						id: source.id,
						fileName: source.fileName,
						ingestStatus: source.ingestStatus,
						ingestErrorCode: source.ingestErrorCode,
					})),
				})),
			}}
			usageLimits={usageLimits}
			telemetry={{
				metadata: {
					isProPlan: isProPlan(workspaceTeam),
					teamType: workspaceTeam.type,
					userId: currentUser.id,
					subscriptionId: workspaceTeam.activeSubscriptionId ?? "",
				},
			}}
			featureFlag={{
				webSearchAction,
				layoutV3,
				experimental_storage,
				stage,
				aiGateway,
				resumableGeneration,
				googleUrlContext,
				documentVectorStore,
			}}
			flowTrigger={{
				callbacks: {
					flowTriggerUpdate: async (flowTrigger) => {
						"use server";
						await db
							.insert(flowTriggers)
							.values({
								teamDbId: workspaceTeam.dbId,
								sdkFlowTriggerId: flowTrigger.id,
								sdkWorkspaceId: flowTrigger.workspaceId,
								staged:
									flowTrigger.configuration.provider === "manual" &&
									flowTrigger.configuration.staged,
							})
							.onConflictDoUpdate({
								target: flowTriggers.dbId,
								set: {
									staged:
										flowTrigger.configuration.provider === "manual" &&
										flowTrigger.configuration.staged,
								},
							});
					},
				},
			}}
		>
			<ZustandBridgeProvider data={data}>{children}</ZustandBridgeProvider>
		</WorkspaceProvider>
	);
}
