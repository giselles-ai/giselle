"use client";

import { Editor, Header } from "@giselle-internal/workflow-designer-ui";
import { updateAgentName } from "./actions";

export default function Page({
	githubTools,
}: {
	githubTools: boolean;
}) {
	return (
		<div className="flex flex-col h-screen bg-black-900">
			<Header onWorkflowNameChange={updateAgentName} />
			<Editor githubTools={githubTools} />
		</div>
	);
}
