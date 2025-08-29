"use client";

import type { Workspace, WorkspaceId } from "@giselle-sdk/data-type";
import { type ReactNode, useEffect, useState } from "react";
import type { TelemetrySettings, UsageLimits } from "../../engine";
import {
	FeatureFlagContext,
	type FeatureFlagContextValue,
} from "../feature-flags";
import { WorkflowDesignerProvider } from "../flow";
import {
	FlowTriggerContext,
	type FlowTriggerContextValue,
} from "../flow-trigger";
import { GenerationRunnerSystemProvider } from "../generations";
import {
	IntegrationProvider,
	type IntegrationProviderProps,
} from "../integrations";
import { TelemetryProvider } from "../telemetry";
import { UsageLimitsProvider } from "../usage-limits";
import { useGiselleEngine } from "../use-giselle-engine";
import {
	type VectorStoreContextValue,
	VectorStoreProvider,
} from "../vector-store";

export function WorkspaceProvider({
	children,
	workspaceId,
	integration,
	usageLimits,
	telemetry,
	featureFlag,
	vectorStore,
	flowTrigger,
}: {
	children: ReactNode;
	workspaceId: WorkspaceId;
	integration?: IntegrationProviderProps;
	usageLimits?: UsageLimits;
	telemetry?: TelemetrySettings;
	featureFlag?: FeatureFlagContextValue;
	vectorStore?: VectorStoreContextValue;
	flowTrigger?: FlowTriggerContextValue;
}) {
	const client = useGiselleEngine();

	const [workspace, setWorkspace] = useState<Workspace | undefined>();
	useEffect(() => {
		client
			.getWorkspace({
				workspaceId,
				useExperimentalStorage: featureFlag?.experimental_storage ?? false,
			})
			.then((workspace) => {
				setWorkspace(workspace);
			});
	}, [workspaceId, client, featureFlag?.experimental_storage]);
	if (workspace === undefined) {
		return null;
	}
	return (
		<FeatureFlagContext
			value={{
				runV3: featureFlag?.runV3 ?? false,
				webSearchAction: featureFlag?.webSearchAction ?? false,
				layoutV3: featureFlag?.layoutV3 ?? false,
				experimental_storage: featureFlag?.experimental_storage ?? false,
				stage: featureFlag?.stage ?? false,
				aiGateway: featureFlag?.aiGateway ?? false,
				resumableGeneration: featureFlag?.resumableGeneration ?? false,
			}}
		>
			<TelemetryProvider settings={telemetry}>
				<FlowTriggerContext value={flowTrigger ?? {}}>
					<UsageLimitsProvider limits={usageLimits}>
						<IntegrationProvider {...integration}>
							<VectorStoreProvider value={vectorStore}>
								<WorkflowDesignerProvider data={workspace}>
									<GenerationRunnerSystemProvider>
										{children}
									</GenerationRunnerSystemProvider>
								</WorkflowDesignerProvider>
							</VectorStoreProvider>
						</IntegrationProvider>
					</UsageLimitsProvider>
				</FlowTriggerContext>
			</TelemetryProvider>
		</FeatureFlagContext>
	);
}
