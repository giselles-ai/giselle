import type { NodeLike } from "@giselle-sdk/data-type";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";
import type { StateCreator } from "zustand";
import type { WorkspaceSlice } from "./workspace-slice";

// A creator function for a slice must now include the full store type
// to enable cross-slice actions, e.g., get().deleteNode()
export type ViewSliceCreator = StateCreator<
	WorkspaceSlice & ViewSlice,
	[],
	[],
	ViewSlice
>;

export interface ViewSlice {
	isLoading: boolean;
	llmProviders: LanguageModelProvider[];
	copiedNode: NodeLike | null;
	setCopiedNode: (node: NodeLike | null) => void;
	setIsLoading: (loading: boolean) => void;
	setLLMProviders: (providers: LanguageModelProvider[]) => void;
}

export const createViewSlice: ViewSliceCreator = (set) => ({
	isLoading: true,
	llmProviders: [],
	copiedNode: null,
	setCopiedNode: (node) => set({ copiedNode: node }),
	setIsLoading: (loading) => set({ isLoading: loading }),
	setLLMProviders: (providers) => set({ llmProviders: providers }),
});
