import type { Task } from "@giselles-ai/protocol";
import { create } from "zustand";

interface ActStore {
	activeAct: Task | undefined;
	creating: boolean;
	setActiveAct: (act: Task | undefined) => void;
	setCreating: (creating: boolean) => void;
}

export const useActStore = create<ActStore>((set) => ({
	activeAct: undefined,
	creating: false,
	setActiveAct: (act: Task | undefined) => {
		set({ activeAct: act });
	},
	setCreating: (creating: boolean) => {
		set({ creating });
	},
}));
