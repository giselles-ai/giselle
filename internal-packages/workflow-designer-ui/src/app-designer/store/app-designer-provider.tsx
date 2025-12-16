import type { Workspace } from "@giselles-ai/protocol";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
	type AppDesignerStoreApi,
	createAppDesignerStore,
} from "./app-designer-store";
import { createAppDesignerPersistenceController } from "./persistence/controller";

export const AppDesignerStoreContext =
	createContext<AppDesignerStoreApi | null>(null);

type AppDesignerProviderProps = React.PropsWithChildren<{
	initialWorkspace: Workspace;
	debounceMs?: number;
	save: (payload: Workspace) => Promise<void>;
	saveBestEffort: (payload: Workspace) => void;
}>;

// function defaultSave(payload: Workspace) {
// 	return fetch("/api/app-designer/save", {
// 		method: "POST",
// 		headers: { "content-type": "application/json" },
// 		body: JSON.stringify(payload),
// 	}).then((r) => {
// 		if (!r.ok) throw new Error("Failed to save");
// 	});
// }

// function defaultSaveBestEffort(payload: Workspace) {
// 	// beforeunload 時は async がほぼ期待できないので Beacon を優先
// 	const url = "/api/app-designer/save";
// 	const body = JSON.stringify(payload);

// 	if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
// 		const blob = new Blob([body], { type: "application/json" });
// 		navigator.sendBeacon(url, blob);
// 		return;
// 	}

// 	// sendBeacon がない場合の fallback（完遂保証はないが best-effort）
// 	void fetch(url, {
// 		method: "POST",
// 		headers: { "content-type": "application/json" },
// 		body,
// 		keepalive: true,
// 	});
// }

export function AppDesignerProvider({
	children,
	initialWorkspace,
	save,
	saveBestEffort,
	debounceMs = 1500,
}: AppDesignerProviderProps) {
	const [storeApi] = useState(() =>
		createAppDesignerStore({ initialWorkspace }),
	);
	const [persistence] = useState(() =>
		createAppDesignerPersistenceController({
			store: storeApi,
			debounceMs,
			save,
			saveBestEffort,
		}),
	);

	// --- route change flush ---
	const pathname = usePathname();
	const pathnameRef = useRef(pathname);

	useEffect(() => {
		// pathname が変わる直前に flush したいので、cleanup を使う
		return () => {
			// ただし初回マウント時 cleanup は走らないので、ref で判定
			// Provider が unmount するケースでもここに入る
			void persistence.flush("routeChange");
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]); // pathname が変わるたびに「前の effect cleanup」が走る

	useEffect(() => {
		pathnameRef.current = pathname;
	}, [pathname]);

	// --- beforeunload flush / confirm ---
	useEffect(() => {
		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			if (!persistence.isDirty()) return;

			// ① best-effort 保存を必ず試す
			persistence.flushBestEffort("beforeUnload");

			// ② ユーザー確認（ブラウザ依存）
			e.preventDefault();
			e.returnValue = "";
		};

		window.addEventListener("beforeunload", onBeforeUnload);
		return () => window.removeEventListener("beforeunload", onBeforeUnload);
	}, [persistence]);

	// Provider unmount cleanup
	useEffect(() => () => persistence.dispose(), [persistence]);
	return (
		<AppDesignerStoreContext.Provider value={storeApi}>
			{children}
		</AppDesignerStoreContext.Provider>
	);
}
export function useAppDesignerStoreApi() {
	const store = useContext(AppDesignerStoreContext);
	if (!store) throw new Error("Missing AppDesignerProvider in the tree");
	return store;
}
