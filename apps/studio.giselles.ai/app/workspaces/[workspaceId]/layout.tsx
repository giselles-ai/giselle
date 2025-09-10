import { WorkspaceId } from "@giselle-sdk/data-type";
import {
	WorkspaceProvider,
	ZustandBridgeProvider,
} from "@giselle-sdk/giselle/react";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { giselleEngine } from "@/app/giselle-engine";
import { db, flowTriggers } from "@/drizzle";
import {
	aiGatewayFlag,
	experimental_storageFlag,
	layoutV3Flag,
	resumableGenerationFlag,
	runV3Flag,
	stageFlag,
	webSearchActionFlag,
} from "@/flags";
import { getGitHubRepositoryIndexes } from "@/lib/vector-stores/github";
import { getGitHubIntegrationState } from "@/packages/lib/github";
import { getUsageLimitsForTeam } from "@/packages/lib/usage-limits";
import { fetchCurrentUser } from "@/services/accounts";
import {
	fetchWorkspaceTeam,
	isMemberOfTeam,
	isProPlan,
} from "@/services/teams";

export default async function Layout({
	params,
	children,
}: {
	params: Promise<{ workspaceId: string }>;
	children: ReactNode;
}) {
	const workspaceId = WorkspaceId.parse((await params).workspaceId);

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
	const runV3 = await runV3Flag();
	const webSearchAction = await webSearchActionFlag();
	const layoutV3 = await layoutV3Flag();
	const experimental_storage = await experimental_storageFlag();
	const stage = await stageFlag();
	const aiGateway = await aiGatewayFlag();
	const resumableGeneration = await resumableGenerationFlag();
	const data = await giselleEngine.getWorkspace(workspaceId, true);

	// return children
	return (
		<WorkspaceProvider
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
				settingPath: "/settings/team/vector-stores",
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
				runV3,
				webSearchAction,
				layoutV3,
				experimental_storage,
				stage,
				aiGateway,
				resumableGeneration,
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
