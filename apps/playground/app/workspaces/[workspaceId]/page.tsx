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

	// URLパラメータからreadOnly状態を取得
	const isReadOnly = searchParams.get("readOnly") === "true";

	// ロールパラメータも取得（指定がなければデフォルトでviewer）
	const userRole = (searchParams.get("role") || "viewer") as
		| "viewer"
		| "guest"
		| "editor"
		| "owner";

	// readOnlyモードの場合、viewerビューを強制的に表示
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
