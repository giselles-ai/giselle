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

const selectPersistedWorkspace = (
	s: AppDesignerStoreState,
): PersistedWorkspace => ({
	nodes: s.nodes,
	connections: s.connections,
});

function hasWorkspaceChanged(
	a: AppDesignerStoreState,
	b: AppDesignerStoreState,
): boolean {
	return (
		a.nodes !== b.nodes || a.connections !== b.connections || a.ui !== b.ui
	);
}

export function createAppDesignerPersistenceController(args: {
	store: StoreApi<AppDesignerStoreState>;
	debounceMs: number;
	save: (payload: Workspace) => Promise<void>;

	/**
	 * beforeunload 用の best-effort 保存。
	 * 実装できるなら sendBeacon/keepalive を使ってください。
	 * できないなら undefined でもOK（その場合は confirm のみに寄せる）
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
		// もし store 側に isDirty 等を持たせているならここで反映してもOK
		// store.getState()._setDirty?.(v);
	};

	const doSave = async (_reason: FlushReason) => {
		clearTimer();

		if (!dirty) return;

		// 保存中にさらに変更が来た場合、終わったらもう一回保存する（取りこぼし防止）
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
					// 直近変更分を即保存（debounce しない）
					await doSave("saveNow");
				}
			}
		})();

		return inFlight;
	};

	// workspace data が変わったら常に dirty + debounce
	const unsubscribe = store.subscribe((state, prev) => {
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
			// best-effort なので握りつぶす
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
