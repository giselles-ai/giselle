import { Background } from "@giselle-internal/workflow-designer-ui";
import { type Workspace, WorkspaceId } from "@giselles-ai/protocol";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { giselle } from "@/app/giselle";
import { agents, db, flowTriggers, workspaces } from "@/db";
import { generateContentNodeFlag } from "@/flags";
import { logger } from "@/lib/logger";
import { getGitHubIntegrationState } from "@/packages/lib/github";
import { dataLoader } from "./data-loader";
import { Page } from "./page.client";

function Loader() {
	return (
		<div className="h-screen w-full">
			<Background />
		</div>
	);
}

export default async function ({
	params,
}: {
	params: Promise<{
		workspaceId: string;
	}>;
}) {
	const { data: workspaceId, success } = WorkspaceId.safeParse(
		(await params).workspaceId,
	);
	if (!success) {
		logger.debug(params);
		return notFound();
	}

	const useNewLanguageModel = await generateContentNodeFlag();
	if (useNewLanguageModel) {
		giselle.updateContext({ experimental_contentGenerationNode: true });
	}

	return (
		<Suspense fallback={<Loader />}>
			<Page
				dataLoader={dataLoader(workspaceId)}
				integrationRefreshAction={async () => {
					"use server";

					const agent = await db.query.agents.findFirst({
						where: (agents, { eq }) => eq(agents.workspaceId, workspaceId),
					});
					if (agent === undefined) {
						logger.warn(`Agent not found for workspace ${workspaceId}`);
						return {};
					}
					return { github: await getGitHubIntegrationState(agent.dbId) };
				}}
				triggerUpdateAction={async (flowTrigger) => {
					"use server";

					const workspace = await db.query.workspaces.findFirst({
						where: (workspaces, { eq }) => eq(workspaces.id, workspaceId),
					});
					if (workspace === undefined) {
						logger.warn(`Workspace not found for workspaceId ${workspaceId}`);
						return;
					}
					await db
						.insert(flowTriggers)
						.values({
							teamDbId: workspace.teamDbId,
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
				}}
				workspaceNameUpdateAction={async (name: string) => {
					"use server";

					await db
						.update(agents)
						.set({ name })
						.where(eq(agents.workspaceId, workspaceId));
					await db
						.update(workspaces)
						.set({ name })
						.where(eq(workspaces.id, workspaceId));
				}}
				workspaceSaveAction={async (workspace: Workspace) => {
					"use server";

					await giselle.updateWorkspace(workspace);
				}}
			/>
		</Suspense>
	);
}
