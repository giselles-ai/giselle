"use client";

import type { ReactNode } from "react";
import type { TelemetrySettings, UsageLimits } from "../../engine";
import {
	FeatureFlagContext,
	type FeatureFlagContextValue,
} from "../feature-flags";
import {
	FlowTriggerContext,
	type FlowTriggerContextValue,
} from "../flow-trigger";
import { ZustandBridgeGenerationProvider } from "../generations";
import {
	IntegrationProvider,
	type IntegrationProviderProps,
} from "../integrations";
import { TelemetryProvider } from "../telemetry";
import { UsageLimitsProvider } from "../usage-limits";
import {
	type VectorStoreContextValue,
	VectorStoreProvider,
} from "../vector-store";

export function WorkspaceProvider({
	children,
	integration,
	usageLimits,
	telemetry,
	featureFlag,
	vectorStore,
	flowTrigger,
}: {
	children: ReactNode;
	integration?: IntegrationProviderProps;
	usageLimits?: UsageLimits;
	telemetry?: TelemetrySettings;
	featureFlag?: FeatureFlagContextValue;
	vectorStore?: VectorStoreContextValue;
	flowTrigger?: FlowTriggerContextValue;
}) {
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
								<ZustandBridgeGenerationProvider>
									{children}
								</ZustandBridgeGenerationProvider>
							</VectorStoreProvider>
						</IntegrationProvider>
					</UsageLimitsProvider>
				</FlowTriggerContext>
			</TelemetryProvider>
		</FeatureFlagContext>
	);
}
