import { db } from "@/drizzle";
import { getUsageLimitsForTeam } from "@/packages/lib/usage-limits";
import { getTeamGitHubAppInstallations } from "@/services/external/github/team-installation";
import { type TeamId, fetchCurrentTeam, isProPlan } from "@/services/teams";
import { WorkspaceId } from "@giselle-sdk/data-type";
import type { Integration } from "@giselle-sdk/integration";
import { WorkspaceProvider } from "giselle-sdk/react";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

async function currentTeamIntegrations(teamId: TeamId) {
	const installationIds = await getTeamGitHubAppInstallations(teamId);
	return [
		{
			provider: "github",
			integrationIds: installationIds,
		} satisfies Integration,
	];
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
	const currentTeam = await fetchCurrentTeam();
	if (currentTeam.dbId !== agent.teamDbId) {
		return notFound();
	}
	const usageLimits = await getUsageLimitsForTeam(currentTeam);
	const integrationValue = await currentTeamIntegrations(currentTeam.id);

	return (
		<WorkspaceProvider
			workspaceId={workspaceId}
			integration={{
				value: integrationValue,
				refresh: async () => {
					"use server";
					return await currentTeamIntegrations(currentTeam.id);
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
