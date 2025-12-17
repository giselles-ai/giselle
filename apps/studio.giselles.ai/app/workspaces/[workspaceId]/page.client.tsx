"use client";

import {
	AppDesignerProvider,
	Editor,
} from "@giselle-internal/workflow-designer-ui";
import type { Integration } from "@giselles-ai/giselle";
import type { Trigger, Workspace } from "@giselles-ai/protocol";
import { useGiselle, WorkspaceProvider } from "@giselles-ai/react";
import { use } from "react";
import type { LoaderData } from "./data-loader";

interface Props {
	dataLoader: Promise<LoaderData>;
	integrationRefreshAction: () => Promise<Partial<Integration>>;
	triggerUpdateAction: (trigger: Trigger) => Promise<void>;
	workspaceSaveAction: (workspace: Workspace) => Promise<void>;
	workspaceNameUpdateAction: (name: string) => Promise<void>;
}
export function Page({
	dataLoader,
	integrationRefreshAction,
	triggerUpdateAction: flowTriggerUpdateAction,
	workspaceNameUpdateAction,
	workspaceSaveAction,
}: Props) {
	const data = use(dataLoader);
	const client = useGiselle();

	return (
		<AppDesignerProvider
			giselleClient={client}
			llmProviders={data.llmProviders}
			save={workspaceSaveAction}
			initialWorkspace={data.data}
		>
			<WorkspaceProvider
				// TODO: Make it reference the same timeout setting as in trigger.config.ts
				generationTimeout={3600 * 1000}
				integration={{
					value: {
						github: data.gitHubIntegrationState,
					},
					refresh: integrationRefreshAction,
				}}
				vectorStore={{
					githubRepositoryIndexes: data.gitHubRepositoryIndexes,
					documentSettingPath: "/settings/team/vector-stores/document",
					githubSettingPath: "/settings/team/vector-stores",
					documentStores: data.documentVectorStores.map((store) => ({
						id: store.id,
						name: store.name,
						embeddingProfileIds: store.embeddingProfileIds,
						sources: store.sources.map((source) => ({
							id: source.id,
							fileName: source.fileName,
							ingestStatus: source.ingestStatus,
							ingestErrorCode: source.ingestErrorCode,
						})),
						isOfficial: store.isOfficial,
					})),
				}}
				usageLimits={data.usageLimits}
				telemetry={{
					metadata: {
						teamPlan: data.workspaceTeam.plan,
						userId: data.currentUser.id,
						subscriptionId: data.workspaceTeam.activeSubscriptionId ?? "",
					},
				}}
				featureFlag={data.featureFlags}
				trigger={{
					callbacks: {
						triggerUpdate: flowTriggerUpdateAction,
					},
				}}
			>
				<div className="flex flex-col h-screen bg-black-900">
					<Editor
						onFlowNameChange={workspaceNameUpdateAction}
						teamName={data.workspaceTeam.name}
						teamAvatarUrl={data.workspaceTeam.avatarUrl}
					/>
				</div>
			</WorkspaceProvider>
		</AppDesignerProvider>
	);
}
