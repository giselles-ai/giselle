import type { ShortcutScope } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useWorkspaceActions } from "../hooks";

export function useSetCurrentShortcutScope() {
	const { setCurrentShortcutScope } = useWorkspaceActions((s) => ({
		setCurrentShortcutScope: s.setCurrentShortcutScope,
	}));
	return useCallback(
		(scope: ShortcutScope, options?: { save?: boolean }) => {
			setCurrentShortcutScope(scope, options);
		},
		[setCurrentShortcutScope],
	);
}
