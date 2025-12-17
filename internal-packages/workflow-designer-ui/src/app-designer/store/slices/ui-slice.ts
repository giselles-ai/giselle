import type { LanguageModelProvider } from "@giselles-ai/language-model";
import type { NodeLike, ShortcutScope } from "@giselles-ai/protocol";
import type { StateCreator } from "zustand";
import type { WorkspaceSlice } from "./workspace-slice";

type UiSliceCreator = StateCreator<WorkspaceSlice & UiSlice, [], [], UiSlice>;

export interface UiSlice {
	llmProviders: LanguageModelProvider[];
	clipboardNode: NodeLike | null;
	setClipboardNode: (node: NodeLike | null) => void;
	currentShortcutScope: ShortcutScope;
	setCurrentShortcutScope: (scope: ShortcutScope) => void;
}

export function createUiSlice(
	initial?: Partial<Pick<UiSlice, "llmProviders" | "currentShortcutScope">>,
): UiSliceCreator {
	return (set) => ({
		llmProviders: initial?.llmProviders ?? [],
		clipboardNode: null,
		setClipboardNode: (node) => set({ clipboardNode: node }),
		currentShortcutScope: initial?.currentShortcutScope ?? "canvas",
		setCurrentShortcutScope: (scope) => set({ currentShortcutScope: scope }),
	});
}
