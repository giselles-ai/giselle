import type { Workspace } from "@giselles-ai/protocol";
import { createStore, type StoreApi } from "zustand";
import { type AppSlice, createAppSlice } from "./slices/app-slice";
import {
	createWorkspaceSlice,
	type WorkspaceSlice,
} from "./slices/workspace-slice";

export type AppDesignerStoreState = WorkspaceSlice & AppSlice;

export type AppDesignerStoreApi = StoreApi<AppDesignerStoreState>;

export function createAppDesignerStore(args: { initialWorkspace: Workspace }) {
	const { initialWorkspace } = args;

	return createStore<AppDesignerStoreState>()((...a) => ({
		...createWorkspaceSlice(initialWorkspace)(...a),
		...createAppSlice(...a),
	}));
}
