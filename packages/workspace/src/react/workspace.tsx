"use client";

import type { Workspace, WorkspaceId } from "@giselle-sdk/data-type";
import {
	GenerationRunnerSystemProvider,
	useGiselleEngine,
} from "@giselle-sdk/giselle-engine/react";
import {
	IntegrationProvider,
	type IntegrationProviderProps,
} from "@giselle-sdk/integration/react";
import type { TelemetrySettings } from "@giselle-sdk/telemetry";
import { TelemetryProvider } from "@giselle-sdk/telemetry/react";
import type { UsageLimits } from "@giselle-sdk/usage-limits";
import { UsageLimitsProvider } from "@giselle-sdk/usage-limits/react";
import {
	type VectorStoreContextValue,
	VectorStoreProvider,
} from "@giselle-sdk/vector-store/react";
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
										githubVectorStore: featureFlag?.githubVectorStore ?? false,
										runV3: featureFlag?.runV3 ?? false,
										sidemenu: featureFlag?.sidemenu ?? false,
										githubTools: featureFlag?.githubTools ?? false,
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
