import type { ShortcutScope } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useUiActions } from "../hooks";

export function useSetCurrentShortcutScope() {
	const { setCurrentShortcutScope } = useUiActions((s) => ({
		setCurrentShortcutScope: s.setCurrentShortcutScope,
	}));
	return useCallback(
		(scope: ShortcutScope) => {
			setCurrentShortcutScope(scope);
		},
		[setCurrentShortcutScope],
	);
}
