"use client";

import { Editor } from "@giselle-internal/workflow-designer-ui";
import { WorkspaceProvider, ZustandBridgeProvider } from "@giselles-ai/react";
import { use } from "react";
import type { LoaderData } from "./data-loader";

interface Props {
	dataLoader: Promise<LoaderData>;
}
export function Page({ dataLoader }: Props) {
	const data = use(dataLoader);

	return (
		<WorkspaceProvider
			featureFlag={{
				webSearchAction: false,
				layoutV3: false,
				stage: true,
				aiGateway: true,
				aiGatewayUnsupportedModels: false,
				googleUrlContext: false,
				generateContentNode: true,
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
			<ZustandBridgeProvider data={data.data}>
				<div className="flex flex-col h-screen bg-black-900">
					<Editor />
				</div>
			</ZustandBridgeProvider>
		</WorkspaceProvider>
	);
}
