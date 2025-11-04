import { WorkspaceProvider } from "@giselle-ai/giselle/react";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<WorkspaceProvider
			featureFlag={{
				webSearchAction: false,
				layoutV3: true,
				stage: true,
				aiGateway: false,
				googleUrlContext: false,
				documentVectorStore: false,
				githubIssuesVectorStore: false,
			}}
		>
			{children}
		</WorkspaceProvider>
	);
}
