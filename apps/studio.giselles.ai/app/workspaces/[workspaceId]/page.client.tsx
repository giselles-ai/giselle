"use client";

import { Editor } from "@giselle-internal/workflow-designer-ui";
import type { FlowTrigger } from "@giselle-sdk/data-type";
import type { Integration } from "@giselle-sdk/giselle";
import {
	WorkspaceProvider,
	ZustandBridgeProvider,
} from "@giselle-sdk/giselle/react";
import { use } from "react";
import { isProPlan } from "@/services/teams/utils";
import type { LoaderData } from "./data-loader";

interface Props {
	dataLoader: Promise<LoaderData>;
	integrationRefreshAction: () => Promise<Partial<Integration>>;
	flowTriggerUpdateAction: (flowTrigger: FlowTrigger) => Promise<void>;
	workspaceNameUpdateAction: (name: string) => Promise<void>;
}
export function Page({
	dataLoader,
	integrationRefreshAction,
	flowTriggerUpdateAction,
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
					isProPlan: isProPlan(data.workspaceTeam),
					teamType: data.workspaceTeam.type,
					userId: data.currentUser.id,
					subscriptionId: data.workspaceTeam.activeSubscriptionId ?? "",
				},
			}}
			featureFlag={data.featureFlags}
			flowTrigger={{
				callbacks: {
					flowTriggerUpdate: flowTriggerUpdateAction,
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
