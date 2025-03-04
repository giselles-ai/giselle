"use client";

import {
	Editor,
	Header,
	RunButton,
} from "@giselle-internal/workflow-designer-ui";
import { useWorkflowDesigner } from "giselle-sdk/react";

export default function Page() {
	const { data } = useWorkflowDesigner();
	const handleRunButtonClick = () => {
		window.open(`/workspaces/${data.id}/run`, "_blank");
	};

	return (
		<div className="flex flex-col h-screen bg-black-900">
			<Header action={<RunButton onClick={handleRunButtonClick} />} />
			<Editor />
		</div>
	);
}
