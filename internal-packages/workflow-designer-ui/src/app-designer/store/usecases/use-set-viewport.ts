import type { OnMoveEnd } from "@xyflow/react";
import { useCallback } from "react";
import { useWorkspaceActions } from "../hooks";

export function useSetViewport(): OnMoveEnd {
	const { setUiViewport } = useWorkspaceActions((s) => ({
		setUiViewport: s.setUiViewport,
	}));

	return useCallback<OnMoveEnd>(
		(_event, viewport) => {
			setUiViewport(viewport, { save: true });
		},
		[setUiViewport],
	);
}
