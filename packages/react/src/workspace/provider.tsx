"use client";

import type { TelemetrySettings, UsageLimits } from "@giselles-ai/giselle";
import type { ReactNode } from "react";
import {
	FeatureFlagContext,
	type FeatureFlagContextValue,
} from "../feature-flags";
import { ZustandBridgeGenerationProvider } from "../generations";
import {
	IntegrationProvider,
	type IntegrationProviderProps,
} from "../integrations";
import { TelemetryProvider } from "../telemetry";
import { TriggerContext, type TriggerContextValue } from "../trigger";
import { UsageLimitsProvider } from "../usage-limits";
import {
	VectorStoreContext,
	type VectorStoreContextValue,
} from "../vector-store";

export function WorkspaceProvider({
	children,
	integration,
	usageLimits,
	telemetry,
	featureFlag,
	vectorStore,
	trigger,
	generationTimeout,
}: {
	children: ReactNode;
	integration?: IntegrationProviderProps;
	usageLimits?: UsageLimits;
	telemetry?: TelemetrySettings;
	featureFlag?: FeatureFlagContextValue;
	vectorStore?: VectorStoreContextValue;
	trigger?: TriggerContextValue;
	generationTimeout?: number;
}) {
	return (
		<FeatureFlagContext
			value={{
				webSearchAction: featureFlag?.webSearchAction ?? false,
				layoutV3: featureFlag?.layoutV3 ?? false,
				stage: featureFlag?.stage ?? false,
				aiGateway: featureFlag?.aiGateway ?? false,
				aiGatewayUnsupportedModels:
					featureFlag?.aiGatewayUnsupportedModels ?? false,
				googleUrlContext: featureFlag?.googleUrlContext ?? false,
				generateContentNode: featureFlag?.generateContentNode ?? false,
				privatePreviewTools: featureFlag?.privatePreviewTools ?? false,
				dataStore: featureFlag?.dataStore ?? false,
				sdkAvailability: featureFlag?.sdkAvailability ?? false,
			}}
		>
			<TelemetryProvider settings={telemetry}>
				<TriggerContext value={trigger ?? {}}>
					<UsageLimitsProvider limits={usageLimits}>
						<IntegrationProvider {...integration}>
							<VectorStoreContext value={vectorStore}>
								<ZustandBridgeGenerationProvider timeout={generationTimeout}>
									{children}
								</ZustandBridgeGenerationProvider>
							</VectorStoreContext>
						</IntegrationProvider>
					</UsageLimitsProvider>
				</TriggerContext>
			</TelemetryProvider>
		</FeatureFlagContext>
	);
}
