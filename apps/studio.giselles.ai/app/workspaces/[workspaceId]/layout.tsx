import { WorkspaceId } from "@giselle-sdk/data-type";
import { WorkspaceProvider } from "@giselle-sdk/giselle-engine/react";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { db } from "@/drizzle";
import {
	experimental_storageFlag,
	githubToolsFlag,
	layoutV2Flag,
	layoutV3Flag,
	runV3Flag,
	sidemenuFlag,
	stageFlag,
	webSearchActionFlag,
} from "@/flags";
import { getGitHubVectorStores } from "@/lib/vector-stores/github";
import { getGitHubIntegrationState } from "@/packages/lib/github";
import { getUsageLimitsForTeam } from "@/packages/lib/usage-limits";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";

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
	const gitHubIntegrationState = await getGitHubIntegrationState(agent.dbId);

	const currentUser = await fetchCurrentUser();

	const currentTeam = await fetchCurrentTeam();
	if (currentTeam.dbId !== agent.teamDbId) {
		return notFound();
	}
	const usageLimits = await getUsageLimitsForTeam(currentTeam);
	const gitHubVectorStores = await getGitHubVectorStores(currentTeam.dbId);
	const runV3 = await runV3Flag();
	const sidemenu = await sidemenuFlag();
	const githubTools = await githubToolsFlag();
	const webSearchAction = await webSearchActionFlag();
	const layoutV2 = await layoutV2Flag();
	const layoutV3 = await layoutV3Flag();
	const experimental_storage = await experimental_storageFlag();
	const stage = await stageFlag();
	return (
		<WorkspaceProvider
			workspaceId={workspaceId}
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
				github: gitHubVectorStores,
				settingPath: "/settings/team/vector-stores",
			}}
			usageLimits={usageLimits}
			telemetry={{
				metadata: {
					isProPlan: isProPlan(currentTeam),
					teamType: currentTeam.type,
					userId: currentUser.id,
					subscriptionId: currentTeam.activeSubscriptionId ?? "",
				},
			}}
			featureFlag={{
				runV3,
				sidemenu,
				githubTools,
				webSearchAction,
				layoutV2,
				layoutV3,
				experimental_storage,
				stage,
			}}
		>
			{children}
		</WorkspaceProvider>
	);
}
