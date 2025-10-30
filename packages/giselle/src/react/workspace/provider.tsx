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
	generationTimeout,
}: {
	children: ReactNode;
	integration?: IntegrationProviderProps;
	usageLimits?: UsageLimits;
	telemetry?: TelemetrySettings;
	featureFlag?: FeatureFlagContextValue;
	vectorStore?: VectorStoreContextValue;
	flowTrigger?: FlowTriggerContextValue;
	generationTimeout?: number;
}) {
	return (
		<FeatureFlagContext
			value={{
				webSearchAction: featureFlag?.webSearchAction ?? false,
				layoutV3: featureFlag?.layoutV3 ?? false,
				stage: featureFlag?.stage ?? false,
				aiGateway: featureFlag?.aiGateway ?? false,
				googleUrlContext: featureFlag?.googleUrlContext ?? false,
				documentVectorStore: featureFlag?.documentVectorStore ?? false,
			}}
		>
			<TelemetryProvider settings={telemetry}>
				<FlowTriggerContext value={flowTrigger ?? {}}>
					<UsageLimitsProvider limits={usageLimits}>
						<IntegrationProvider {...integration}>
							<VectorStoreProvider value={vectorStore}>
								<ZustandBridgeGenerationProvider timeout={generationTimeout}>
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
