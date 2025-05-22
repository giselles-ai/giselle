"use client";

import {
	Editor,
	Header,
	SettingsView,
	Viewer,
} from "@giselle-internal/workflow-designer-ui";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useSearchParams } from "next/navigation";

export default function Page() {
	const { view } = useWorkflowDesigner();
	const searchParams = useSearchParams();

	// Get the readOnly state from URL parameters
	const isReadOnly = searchParams.get("readOnly") === "true";

	// Retrieve role parameter or default to viewer
	const userRole = (searchParams.get("role") || "viewer") as
		| "viewer"
		| "guest"
		| "editor"
		| "owner";

	// Force viewer view when in read-only mode
	const currentView = isReadOnly ? "viewer" : view;

	return (
		<div className="flex flex-col h-screen bg-black-900">
			<Header isReadOnly={isReadOnly} shareFeatureFlag />
			{currentView === "editor" && <Editor githubTools />}
			{currentView === "viewer" && (
				<Editor githubTools isReadOnly={isReadOnly} userRole={userRole} />
			)}
			{currentView === "integrator" && <SettingsView />}
		</div>
	);
}
