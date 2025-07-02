import { Editor, Header } from "@giselle-internal/workflow-designer-ui";
import { WorkspaceId } from "@giselle-sdk/data-type";
import { layoutV2Flag } from "@/flags";
import { updateAgentName } from "./actions";

export default async function Page({
	params,
}: {
	params: Promise<{ workspaceId: string }>;
}) {
	const layoutV2 = await layoutV2Flag();
	const { workspaceId } = await params;
	async function updateName(name: string) {
		"use server";
		await updateAgentName(WorkspaceId.parse(workspaceId), name);
	}
	return (
		<div className="flex flex-col h-screen bg-black-900">
			{!layoutV2 && <Header onWorkflowNameChange={updateAgentName} />}
			<Editor onFlowNameChange={updateName} />
		</div>
	);
}
