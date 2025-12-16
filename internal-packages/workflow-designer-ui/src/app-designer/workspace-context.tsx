import { createContext, useContext, useState } from "react";
import { useStore } from "zustand/react";
import {
	createWorkspaceStore,
	type WorkspaceActions,
	type WorkspaceData,
	type WorkspaceStoreApi,
} from "./workspace-store";

export const WorkspaceStoreContext = createContext<WorkspaceStoreApi | null>(
	null,
);

type WorkspaceProviderProps = React.PropsWithChildren<{
	initialState: WorkspaceData;
}>;

export function WorkspaceProvider({
	children,
	initialState,
}: WorkspaceProviderProps) {
	const [storeApi] = useState(() => createWorkspaceStore(initialState));
	return (
		<WorkspaceStoreContext.Provider value={storeApi}>
			{children}
		</WorkspaceStoreContext.Provider>
	);
}
export function useWorkspaceStoreApi() {
	const store = useContext(WorkspaceStoreContext);
	if (!store) throw new Error("Missing WorkspaceProvider in the tree");
	return store;
}
export function useWorkspace<T>(selector: (data: WorkspaceData) => T): T {
	const store = useWorkspaceStoreApi();
	return useStore(store, (s) => selector(s.data));
}
export function useWorkspaceActions(): WorkspaceActions {
	const store = useWorkspaceStoreApi();
	return useStore(store, (s) => s.actions);
}
