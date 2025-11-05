"use client";

import type { Workspace } from "@giselle-ai/protocol";
import { createContext, useContext } from "react";
import { useStore } from "zustand/react";
import { useStoreWithEqualityFn } from "zustand/traditional";
import {
	createEditorStore,
	type EditorAction,
	type EditorState,
	type EditorStore,
} from "./store";

const EditorStoreContext = createContext<EditorStore | null>(null);

export function EditorStoreProvider({
	children,
	workspace,
}: React.PropsWithChildren<{
	workspace: Workspace;
}>) {
	const s = createEditorStore({ workspace });
	return (
		<EditorStoreContext.Provider value={s}>
			{children}
		</EditorStoreContext.Provider>
	);
}

export function useEditorStore<T>(
	selector: (s: EditorState & EditorAction) => T,
) {
	const store = useContext(EditorStoreContext);
	if (!store)
		throw new Error("useEditor must be used within <EditorStoreProvider/>");
	return useStore(store, selector);
}

export function useEditorStoreWithEqualityFn<T>(
	selector: (s: EditorState & EditorAction) => T,
	equalityFn: (a: T, b: T) => boolean,
) {
	const store = useContext(EditorStoreContext);
	if (!store)
		throw new Error("useEditor must be used within <EditorStoreProvider/>");
	return useStoreWithEqualityFn(store, selector, equalityFn);
}
