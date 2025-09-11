import {
	Editor,
	UpdateNotificationProvider,
} from "@giselle-internal/workflow-designer-ui";
import { WorkspaceId } from "@giselle-sdk/data-type";
import { updateAgentName } from "./actions";

export default async function Page({
	params,
}: {
	params: Promise<{ workspaceId: string }>;
}) {
	const { workspaceId } = await params;
	async function updateName(name: string) {
		"use server";
		await updateAgentName(WorkspaceId.parse(workspaceId), name);
	}
	return (
		<UpdateNotificationProvider>
			<div className="flex flex-col h-screen bg-black-900">
				<Editor onFlowNameChange={updateName} />
			</div>
		</UpdateNotificationProvider>
	);
}
