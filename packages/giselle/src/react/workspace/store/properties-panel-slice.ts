import type { StateCreator } from "zustand";
import type { AppStore } from "./store";

export interface PropertiesPanelSlice {
	propertiesTab: string;
	openPropertiesPanel: boolean;
	setPropertiesTab: (tab: string) => void;
	setOpenPropertiesPanel: (isOpen: boolean) => void;
}

export const createPropertiesPanelSlice: StateCreator<
	AppStore,
	[],
	[],
	PropertiesPanelSlice
> = (set) => ({
	propertiesTab: "",
	openPropertiesPanel: false,
	setPropertiesTab: (tab) => set({ propertiesTab: tab }),
	setOpenPropertiesPanel: (isOpen) => set({ openPropertiesPanel: isOpen }),
});
