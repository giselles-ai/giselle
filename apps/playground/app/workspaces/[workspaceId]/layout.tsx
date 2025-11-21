import { WorkspaceProvider } from "@giselles-ai/react";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<WorkspaceProvider
			featureFlag={{
				webSearchAction: false,
				layoutV3: true,
				stage: true,
				aiGateway: false,
				aiGatewayUnsupportedModels: false,
				googleUrlContext: false,
				generateContentNode: false,
			}}
		>
			{children}
		</WorkspaceProvider>
	);
}
