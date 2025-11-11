"use client";

import type { ReactNode } from "react";
import type { TelemetrySettings, UsageLimits } from "../../engine";
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
				googleUrlContext: featureFlag?.googleUrlContext ?? false,
				githubIssuesVectorStore: featureFlag?.githubIssuesVectorStore ?? false,
			}}
		>
			<TelemetryProvider settings={telemetry}>
				<TriggerContext value={trigger ?? {}}>
					<UsageLimitsProvider limits={usageLimits}>
						<IntegrationProvider {...integration}>
							<VectorStoreProvider value={vectorStore}>
								<ZustandBridgeGenerationProvider timeout={generationTimeout}>
									{children}
								</ZustandBridgeGenerationProvider>
							</VectorStoreProvider>
						</IntegrationProvider>
					</UsageLimitsProvider>
				</TriggerContext>
			</TelemetryProvider>
		</FeatureFlagContext>
	);
}
