import type { LanguageModelId } from "@giselles-ai/language-model-registry";
import { create } from "zustand";

interface LanguageModelV2ToggleState {
	hover: LanguageModelId | undefined;
	setHover: (by: LanguageModelId) => void;
	clearHover: () => void;
}
export const useLanguageModelV2ToggleGroupStore =
	create<LanguageModelV2ToggleState>()((set) => ({
		hover: undefined,
		setHover: (by) => set((state) => ({ ...state, hover: by })),
		clearHover: () => set((state) => ({ ...state, hover: undefined })),
	}));
