import type { Workspace } from "@giselles-ai/protocol";
import { use } from "react";
import {
	DebugForm,
	DebugViewer,
	NodeCanvas,
	PropertiesPanel,
} from "./components";
import { EditorStoreProvider } from "./store/context";

export function NewEditor({
	workspace: workspacePromise,
}: {
	workspace: Promise<Workspace>;
}) {
	const workspace = use(workspacePromise);
	return (
		<EditorStoreProvider workspace={workspace}>
			<div className="h-screen flex flex-col overflow-y-hidden">
				<div className="flex divide-x shrink-0">
					<div className="flex-1">
						<DebugViewer />
					</div>
					<div className="flex-1">
						<DebugForm />
					</div>
				</div>
				<div className="flex-1 h-full min-h-0 flex">
					<div className="flex-1 min-w-0">
						<NodeCanvas />
					</div>
					<PropertiesPanel />
				</div>
			</div>
		</EditorStoreProvider>
	);
}
