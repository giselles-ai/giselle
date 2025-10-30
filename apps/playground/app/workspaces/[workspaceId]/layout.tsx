import { WorkspaceProvider } from "@giselle-sdk/giselle/react";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<WorkspaceProvider
			featureFlag={{
				webSearchAction: false,
				layoutV3: true,
				stage: true,
				aiGateway: false,
				resumableGeneration: false,
				googleUrlContext: false,
				documentVectorStore: false,
				githubIssuesVectorStore: false,
			}}
		>
			{children}
		</WorkspaceProvider>
	);
}
