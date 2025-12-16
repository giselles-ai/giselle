import type { Workspace } from "@giselles-ai/protocol";
import { createStore, type StoreApi } from "zustand";
import { type AppSlice, createAppSlice } from "./slices/app-slice";
import { createUiSlice, type UiSlice } from "./slices/ui-slice";
import {
	createWorkspaceSlice,
	type WorkspaceSlice,
} from "./slices/workspace-slice";

export type AppDesignerStoreState = WorkspaceSlice & AppSlice & UiSlice;

export type AppDesignerStoreApi = StoreApi<AppDesignerStoreState>;

export function createAppDesignerStore(args: { initialWorkspace: Workspace }) {
	const { initialWorkspace } = args;

	return createStore<AppDesignerStoreState>()((...a) => ({
		...createWorkspaceSlice(initialWorkspace)(...a),
		...createUiSlice(...a),
		...createAppSlice(...a),
	}));
}
