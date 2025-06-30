"use client";

import type { Workspace, WorkspaceId } from "@giselle-sdk/data-type";
import type {
	TelemetrySettings,
	UsageLimits,
} from "@giselle-sdk/giselle-engine";
import {
	GenerationRunnerSystemProvider,
	IntegrationProvider,
	type IntegrationProviderProps,
	TelemetryProvider,
	UsageLimitsProvider,
	type VectorStoreContextValue,
	VectorStoreProvider,
	useGiselleEngine,
} from "@giselle-sdk/giselle-engine/react";
import { WorkflowDesignerProvider } from "@giselle-sdk/workflow-designer/react";
import { type ReactNode, useEffect, useState } from "react";
import {
	FeatureFlagContext,
	type FeatureFlagContextValue,
} from "./feature-flag";

export function WorkspaceProvider({
	children,
	workspaceId,
	integration,
	usageLimits,
	telemetry,
	featureFlag,
	vectorStore,
}: {
	children: ReactNode;
	workspaceId: WorkspaceId;
	integration?: IntegrationProviderProps;
	usageLimits?: UsageLimits;
	telemetry?: TelemetrySettings;
	featureFlag?: FeatureFlagContextValue;
	vectorStore?: VectorStoreContextValue;
}) {
	const client = useGiselleEngine();

	const [workspace, setWorkspace] = useState<Workspace | undefined>();
	useEffect(() => {
		client
			.getWorkspace({
				workspaceId,
			})
			.then((workspace) => {
				setWorkspace(workspace);
			});
	}, [workspaceId, client]);
	if (workspace === undefined) {
		return null;
	}
	return (
		<TelemetryProvider settings={telemetry}>
			<UsageLimitsProvider limits={usageLimits}>
				<IntegrationProvider {...integration}>
					<VectorStoreProvider value={vectorStore}>
						<WorkflowDesignerProvider data={workspace}>
							<GenerationRunnerSystemProvider>
								<FeatureFlagContext
									value={{
										runV3: featureFlag?.runV3 ?? false,
										sidemenu: featureFlag?.sidemenu ?? false,
										githubTools: featureFlag?.githubTools ?? false,
										webSearchAction: featureFlag?.webSearchAction ?? false,
										layoutV2: featureFlag?.layoutV2 ?? false,
									}}
								>
									{children}
								</FeatureFlagContext>
							</GenerationRunnerSystemProvider>
						</WorkflowDesignerProvider>
					</VectorStoreProvider>
				</IntegrationProvider>
			</UsageLimitsProvider>
		</TelemetryProvider>
	);
}
