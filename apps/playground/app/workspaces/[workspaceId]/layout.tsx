import { WorkspaceProvider } from "@giselle-sdk/giselle/react";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<WorkspaceProvider
			featureFlag={{
				runV3: true,
				webSearchAction: false,
				layoutV3: true,
				experimental_storage: true,
				stage: true,
				aiGateway: false,
				resumableGeneration: false,
			}}
		>
			{children}
		</WorkspaceProvider>
	);
}
