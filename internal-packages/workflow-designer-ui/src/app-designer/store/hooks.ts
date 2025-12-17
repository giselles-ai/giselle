import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { useAppDesignerStoreApi } from "./app-designer-provider";
import type { AppDesignerStoreState } from "./app-designer-store";
import type { UiSlice } from "./slices/ui-slice";
import type { WorkspaceActions } from "./slices/workspace-slice";

export function useAppDesignerStore<T>(
	selector: (state: AppDesignerStoreState) => T,
): T {
	const store = useAppDesignerStoreApi();
	return useStoreWithEqualityFn(store, selector, shallow);
}

export function useWorkspaceActions<T>(
	selector: (actions: WorkspaceActions) => T,
): T {
	return useAppDesignerStore((s) =>
		selector({
			addNode: s.addNode,
			upsertUiNodeState: s.upsertUiNodeState,
			updateNode: s.updateNode,
			addNodeInput: s.addNodeInput,
			addConnection: s.addConnection,
			removeConnection: s.removeConnection,
			removeNode: s.removeNode,
			setUiNodeState: s.setUiNodeState,
			setUiViewport: s.setUiViewport,
			setCurrentShortcutScope: s.setCurrentShortcutScope,
			setSelectedConnectionIds: s.setSelectedConnectionIds,
			updateWorkspaceName: s.updateWorkspaceName,
		}),
	);
}

export function useUiActions<T>(
	selector: (actions: Pick<UiSlice, "setClipboardNode">) => T,
): T {
	return useAppDesignerStore((s) =>
		selector({
			setClipboardNode: s.setClipboardNode,
		}),
	);
}
