import { useCallback } from "react";
import { useSyncAppConnectionStateIfNeededContext } from "../app-connection-state-sync-provider";

/**
 * Syncs the App's connected/disconnected state if needed.
 *
 * Note: callers should not care about the internal scheduling (queueing).
 * They only express the intent: "connectivity may have changed, so ensure the App is up to date."
 */
export function useSyncAppConnectionStateIfNeeded() {
	const syncIfNeeded = useSyncAppConnectionStateIfNeededContext();
	return useCallback(() => {
		syncIfNeeded();
	}, [syncIfNeeded]);
}
