import type { NodeLike } from "@giselle-sdk/data-type";
import { createContext, useContext } from "react";

export interface WorkspaceCallbackContextValue {
	createNode?: (node: NodeLike) => void;
	updateNode?: (node: NodeLike) => void;
	removeNode?: (node: NodeLike) => void;
}

export const WorkspaceCallbackContext = createContext<
	WorkspaceCallbackContextValue | undefined
>(undefined);

export const useWorkspaceCallback = () => {
	const context = useContext(WorkspaceCallbackContext);
	if (!context) {
		throw new Error(
			"useWorkspaceCallback must be used within a WorkspaceCallbackProvider",
		);
	}
	return context;
};
