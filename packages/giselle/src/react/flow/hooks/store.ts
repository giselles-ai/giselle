import { create } from "zustand";
import { createFileSlice, type FileSlice } from "./file-slice";
import {
	createPropertiesPanelSlice,
	type PropertiesPanelSlice,
} from "./properties-panel-slice";
import { createViewSlice, type ViewSlice } from "./view-slice";
import { createWorkspaceSlice, type WorkspaceSlice } from "./workspace-slice";

// The full store type is the intersection of all slice types
export type AppStore = WorkspaceSlice &
	ViewSlice &
	FileSlice &
	PropertiesPanelSlice;

export const useAppStore = create<AppStore>()((...a) => ({
	...createWorkspaceSlice(...a),
	...createViewSlice(...a),
	...createFileSlice(...a),
	...createPropertiesPanelSlice(...a),
}));
