"use client";

import { Editor, Header, Viewer } from "@giselle-internal/workflow-designer-ui";
import { useWorkflowDesigner } from "giselle-sdk/react";

export default function Page() {
	const { view } = useWorkflowDesigner();

	return (
		<div className="flex flex-col h-screen bg-black-900">
			<Header />
			{view === "editor" ? <Editor /> : <Viewer />}
		</div>
	);
}
