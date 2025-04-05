import { db } from "@/drizzle";
import { getGitHubIntegrationState } from "@/packages/lib/github";
import { getUsageLimitsForTeam } from "@/packages/lib/usage-limits";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import { WorkspaceId } from "@giselle-sdk/data-type";
import { WorkspaceProvider } from "giselle-sdk/react";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

async function getIntegrationState(agentDbId: number) {
	const githubIntegrationState = await getGitHubIntegrationState(agentDbId);
	return {
		github: githubIntegrationState,
	};
}

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
	const integrationState = await getIntegrationState(agent.dbId);

	const currentTeam = await fetchCurrentTeam();
	if (currentTeam.dbId !== agent.teamDbId) {
		return notFound();
	}
	const usageLimits = await getUsageLimitsForTeam(currentTeam);

	return (
		<WorkspaceProvider
			workspaceId={workspaceId}
			integration={{
				state: integrationState,
				reloadState: async () => {
					"use server";
					return await getIntegrationState(agent.dbId);
				},
			}}
			usageLimits={usageLimits}
			telemetry={{
				metadata: {
					isProPlan: isProPlan(currentTeam),
					teamType: currentTeam.type,
				},
			}}
		>
			{children}
		</WorkspaceProvider>
	);
}
