"use client";

import {
	AppDesignerProvider,
	Editor,
} from "@giselle-internal/workflow-designer-ui";
import type { Workspace } from "@giselles-ai/protocol";
import { useGiselle, WorkspaceProvider } from "@giselles-ai/react";
import { use } from "react";
import type { LoaderData } from "./data-loader";

interface Props {
	dataLoader: Promise<LoaderData>;
	workspaceSaveAction: (workspace: Workspace) => Promise<void>;
}
export function Page({ dataLoader, workspaceSaveAction }: Props) {
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
				featureFlag={{
					webSearchAction: false,
					layoutV3: false,
					stage: true,
					aiGateway: true,
					aiGatewayUnsupportedModels: false,
					googleUrlContext: false,
					generateContentNode: true,
					privatePreviewTools: true,
					apiPublishing: false,
					dataStore: false,
				}}
				usageLimits={{
					featureTier: "pro",
					resourceLimits: {
						agentTime: {
							limit: 9999999,
							used: 0,
						},
					},
				}}
			>
				<div className="flex flex-col h-screen bg-black-900">
					<Editor />
				</div>
			</WorkspaceProvider>
		</AppDesignerProvider>
	);
}
