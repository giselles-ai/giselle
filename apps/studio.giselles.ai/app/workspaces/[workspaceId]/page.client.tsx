"use client";

import { Editor } from "@giselle-internal/workflow-designer-ui";
import type { Integration } from "@giselles-ai/giselle";
import {
	WorkspaceProvider,
	ZustandBridgeProvider,
} from "@giselles-ai/react";
import type { Trigger } from "@giselles-ai/protocol";
import { use } from "react";
import type { LoaderData } from "./data-loader";

interface Props {
	dataLoader: Promise<LoaderData>;
	integrationRefreshAction: () => Promise<Partial<Integration>>;
	triggerUpdateAction: (trigger: Trigger) => Promise<void>;
	workspaceNameUpdateAction: (name: string) => Promise<void>;
}
export function Page({
	dataLoader,
	integrationRefreshAction,
	triggerUpdateAction: flowTriggerUpdateAction,
	workspaceNameUpdateAction,
}: Props) {
	const data = use(dataLoader);

	return (
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
			<ZustandBridgeProvider data={data.data}>
				<div className="flex flex-col h-screen bg-black-900">
					<Editor onFlowNameChange={workspaceNameUpdateAction} />
				</div>
			</ZustandBridgeProvider>
		</WorkspaceProvider>
	);
}
