import { WorkspaceId } from "@giselle-sdk/data-type";
import { WorkspaceProvider } from "giselle-sdk/react";
import type { ReactNode } from "react";

export default async function Layout({
	params,
	children,
}: {
	params: Promise<{ workspaceId: string }>;
	children: ReactNode;
}) {
	const workspaceId = WorkspaceId.parse((await params).workspaceId);
	return (
		<WorkspaceProvider
			workspaceId={workspaceId}
			featureFlag={{
				githubVectorStore: true,
				runV3: true,
				sidemenu: true,
				githubTools: true,
			}}
		>
			{children}
		</WorkspaceProvider>
	);
}
