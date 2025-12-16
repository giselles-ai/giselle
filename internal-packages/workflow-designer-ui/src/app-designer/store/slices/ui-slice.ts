import type { LanguageModelProvider } from "@giselles-ai/language-model";
import type { NodeLike } from "@giselles-ai/protocol";
import type { StateCreator } from "zustand";
import type { WorkspaceSlice } from "./workspace-slice";

type UiSliceCreator = StateCreator<WorkspaceSlice & UiSlice, [], [], UiSlice>;

export interface UiSlice {
	llmProviders: LanguageModelProvider[];
	clipboardNode: NodeLike | null;
	setClipboardNode: (node: NodeLike | null) => void;
}

export function createUiSlice(
	initial?: Partial<Pick<UiSlice, "llmProviders">>,
): UiSliceCreator {
	return (set) => ({
		llmProviders: initial?.llmProviders ?? [],
		clipboardNode: null,
		setClipboardNode: (node) => set({ clipboardNode: node }),
	});
}
