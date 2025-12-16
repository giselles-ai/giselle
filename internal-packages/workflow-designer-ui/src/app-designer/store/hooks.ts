import { useStore } from "zustand/react";
import { useAppDesignerStoreApi } from "./app-designer-provider";
import type { AppDesignerStoreState } from "./app-designer-store";
import type { WorkspaceActions } from "./slices/workspace-slice";

export function useAppDesignerStore<T>(
	selector: (state: AppDesignerStoreState) => T,
): T {
	const store = useAppDesignerStoreApi();
	return useStore(store, selector);
}

export function useWorkspaceActions<T>(
	selector: (actions: WorkspaceActions) => T,
): T {
	return useAppDesignerStore((s) =>
		selector({
			addNode: s.addNode,
			updateNode: s.updateNode,
			deleteNode: s.deleteNode,
			addConnection: s.addConnection,
			deleteConnection: s.deleteConnection,
			setUiNodeState: s.setUiNodeState,
			setUiViewport: s.setUiViewport,
			selectConnection: s.selectConnection,
			deselectConnection: s.deselectConnection,
			updateNodeData: s.updateNodeData,
			updateNodeDataContent: s.updateNodeDataContent,
			updateFileStatus: s.updateFileStatus,
		}),
	);
}
