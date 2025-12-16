import type { Workspace } from "@giselles-ai/protocol";
import { createContext, useContext, useState } from "react";
import {
	type AppDesignerStoreApi,
	createAppDesignerStore,
} from "./app-designer-store";

export const AppDesignerStoreContext =
	createContext<AppDesignerStoreApi | null>(null);

type AppDesignerProviderProps = React.PropsWithChildren<{
	initialWorkspace: Workspace;
}>;

export function AppDesignerProvider({
	children,
	initialWorkspace,
}: AppDesignerProviderProps) {
	const [storeApi] = useState(() =>
		createAppDesignerStore({ initialWorkspace }),
	);
	return (
		<AppDesignerStoreContext.Provider value={storeApi}>
			{children}
		</AppDesignerStoreContext.Provider>
	);
}
export function useAppDesignerStoreApi() {
	const store = useContext(AppDesignerStoreContext);
	if (!store) throw new Error("Missing AppDesignerProvider in the tree");
	return store;
}
