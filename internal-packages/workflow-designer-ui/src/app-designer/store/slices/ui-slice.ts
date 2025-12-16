import type { LanguageModelProvider } from "@giselles-ai/language-model";
import type { NodeLike } from "@giselles-ai/protocol";
import type { StateCreator } from "zustand";
import type { WorkspaceSlice } from "./workspace-slice";

type UiSliceCreator = StateCreator<WorkspaceSlice & UiSlice, [], [], UiSlice>;

export interface UiSlice {
	isLoading: boolean;
	llmProviders: LanguageModelProvider[];
	clipboardNode: NodeLike | null;
	setClipboardNode: (node: NodeLike | null) => void;
	setIsLoading: (loading: boolean) => void;
	setLLMProviders: (providers: LanguageModelProvider[]) => void;
}

export const createUiSlice: UiSliceCreator = (set) => ({
	isLoading: true,
	llmProviders: [],
	clipboardNode: null,
	setClipboardNode: (node) => set({ clipboardNode: node }),
	setIsLoading: (loading) => set({ isLoading: loading }),
	setLLMProviders: (providers) => set({ llmProviders: providers }),
});
