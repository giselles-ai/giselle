import type { Connection, NodeLike, Workspace } from "@giselles-ai/protocol";
import type { StoreApi } from "zustand";
import type { AppDesignerStoreState } from "../app-designer-store";

export type PersistedWorkspace = {
	nodes: NodeLike[];
	connections: Connection[];
};

export type FlushReason =
	| "debounce"
	| "saveNow"
	| "routeChange"
	| "beforeUnload";

export type AppDesignerPersistence = {
	saveNow: () => Promise<void>;
	flush: (reason?: FlushReason) => Promise<void>;
	isDirty: () => boolean;
	dispose: () => void;
	flushBestEffort: (reason?: FlushReason) => void;
};

const selectPersistedWorkspace = (s: AppDesignerStoreState): Workspace => ({
	id: s.id,
	nodes: s.nodes,
	connections: s.connections,
	schemaVersion: s.schemaVersion,
	ui: s.ui,
});

function hasWorkspaceChanged(
	a: AppDesignerStoreState,
	b: AppDesignerStoreState,
): boolean {
	return (
		a._skipNextSave !== b._skipNextSave ||
		a.nodes !== b.nodes ||
		a.connections !== b.connections ||
		a.ui !== b.ui
	);
}

export function createAppDesignerPersistenceController(args: {
	store: StoreApi<AppDesignerStoreState>;
	debounceMs: number;
	save: (payload: Workspace) => Promise<void>;

	/**
	 * Best-effort save for beforeunload.
	 * Use sendBeacon/keepalive if possible.
	 * undefined is OK if not implementable (in that case, rely on confirm only)
	 */
	saveBestEffort?: (payload: Workspace) => void;
}): AppDesignerPersistence {
	const { store, debounceMs, save, saveBestEffort } = args;

	let timer: ReturnType<typeof setTimeout> | null = null;
	let inFlight: Promise<void> | null = null;
	let queued = false;
	let dirty = false;

	const clearTimer = () => {
		if (timer) clearTimeout(timer);
		timer = null;
	};

	const setDirty = (v: boolean) => {
		dirty = v;
		// If the store has isDirty or similar, it's OK to reflect it here
		// store.getState()._setDirty?.(v);
	};

	const doSave = async (_reason: FlushReason) => {
		clearTimer();

		if (!dirty) return;

		// If further changes come in during save, save again after completion (to prevent data loss)
		if (inFlight) {
			queued = true;
			return inFlight;
		}

		const payload = selectPersistedWorkspace(store.getState());

		inFlight = (async () => {
			try {
				await save(payload);
				setDirty(false);
			} finally {
				inFlight = null;
				if (queued) {
					queued = false;
					// Save recent changes immediately (without debounce)
					await doSave("saveNow");
				}
			}
		})();

		return await inFlight;
	};

	// Always mark dirty + debounce when workspace data changes
	const unsubscribe = store.subscribe((state, prev) => {
		if (state._skipNextSave) {
			// Reset and ignore this change
			store.setState({
				_skipNextSave: false,
			} as Partial<AppDesignerStoreState>);
			return;
		}
		if (!hasWorkspaceChanged(state, prev)) return;
		setDirty(true);

		clearTimer();
		timer = setTimeout(() => {
			void doSave("debounce");
		}, debounceMs);
	});

	const flushBestEffort = (_reason: FlushReason = "beforeUnload") => {
		if (!saveBestEffort) return;
		if (!dirty) return;

		try {
			const payload = selectPersistedWorkspace(store.getState());
			saveBestEffort(payload);
		} catch {
			// Swallow error since this is best-effort
		}
	};

	return {
		saveNow: () => doSave("saveNow"),
		flush: (reason: FlushReason = "saveNow") => doSave(reason),
		isDirty: () => dirty,
		dispose: () => {
			clearTimer();
			unsubscribe();
		},
		flushBestEffort,
	};
}
