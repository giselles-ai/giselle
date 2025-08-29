import { WorkspaceId } from "@giselle-sdk/data-type";
import { WorkspaceProvider } from "@giselle-sdk/giselle/react";
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
