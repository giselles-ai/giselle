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
			addConnection: s.addConnection,
			removeNode: s.removeNode,
			removeConnection: s.removeConnection,
			upsertNodeUiState: s.upsertNodeUiState,
		}),
	);
}
