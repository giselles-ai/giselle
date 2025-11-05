"use client";

import { Editor } from "@giselle-internal/workflow-designer-ui";
import type { Integration } from "@giselles-ai/giselle";
import {
	WorkspaceProvider,
	ZustandBridgeProvider,
} from "@giselles-ai/giselle/react";
import {
	type FlowTrigger,
	isTriggerNode,
	type TriggerNode,
} from "@giselles-ai/protocol";
import { use } from "react";
import { isProPlan } from "@/services/teams/utils";
import type { LoaderData } from "./data-loader";

interface Props {
	dataLoader: Promise<LoaderData>;
	integrationRefreshAction: () => Promise<Partial<Integration>>;
	flowTriggerUpdateAction: (flowTrigger: FlowTrigger) => Promise<void>;
	workspaceNameUpdateAction: (name: string) => Promise<void>;
	createAppEntryNodeAction: (node: TriggerNode) => Promise<void>;
	deleteAppEntryNodeAction: (node: TriggerNode) => Promise<void>;
}
export function Page({
	dataLoader,
	integrationRefreshAction,
	flowTriggerUpdateAction,
	workspaceNameUpdateAction,
	createAppEntryNodeAction,
	deleteAppEntryNodeAction,
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
			<ZustandBridgeProvider
				data={data.data}
				onAddNode={async (node) => {
					if (!isTriggerNode(node) || node.content.provider !== "app-entry") {
						return;
					}
					await createAppEntryNodeAction(node);
				}}
				onDeleteNode={async (node) => {
					if (!isTriggerNode(node)) {
						return;
					}
					await deleteAppEntryNodeAction(node);
				}}
			>
				<div className="flex flex-col h-screen bg-black-900">
					<Editor onFlowNameChange={workspaceNameUpdateAction} />
				</div>
			</ZustandBridgeProvider>
		</WorkspaceProvider>
	);
}
