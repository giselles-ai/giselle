import { createStore } from "zustand/vanilla";
import type { StepsSectionData } from "./steps-section";

export interface StepsSectionStoreState {
	stepsSectionData: StepsSectionData;
	setStepsSectionData: (stepsSectionData: StepsSectionData) => void;
}

export type StepsSectionStore = ReturnType<typeof createStepsSectionStore>;

export function createStepsSectionStore(initialData: StepsSectionData) {
	return createStore<StepsSectionStoreState>()((set) => ({
		stepsSectionData: initialData,
		setStepsSectionData: (stepsSectionData) => {
			set({ stepsSectionData });
		},
	}));
}

