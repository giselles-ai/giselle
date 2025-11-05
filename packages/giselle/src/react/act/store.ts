import { create } from "zustand";
import type { Act } from "../../concepts";

interface ActStore {
	activeAct: Act | undefined;
	creating: boolean;
	setActiveAct: (act: Act | undefined) => void;
	setCreating: (creating: boolean) => void;
}

export const useActStore = create<ActStore>((set) => ({
	activeAct: undefined,
	creating: false,
	setActiveAct: (act: Act | undefined) => {
		set({ activeAct: act });
	},
	setCreating: (creating: boolean) => {
		set({ creating });
	},
}));
