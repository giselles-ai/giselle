import type { Workspace } from "@giselles-ai/protocol";
import type { GiselleClient } from "@giselles-ai/react";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
	type AppDesignerStoreApi,
	createAppDesignerStore,
} from "./app-designer-store";
import { GiselleClientProvider } from "./giselle-client-provider";
import { createAppDesignerPersistenceController } from "./persistence/controller";

export const AppDesignerStoreContext =
	createContext<AppDesignerStoreApi | null>(null);

type AppDesignerProviderProps = React.PropsWithChildren<{
	initialWorkspace: Workspace;
	giselleClient: GiselleClient;
	debounceMs?: number;
	save: (payload: Workspace) => Promise<void>;
	saveBestEffort?: (payload: Workspace) => void;
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
// 	// Prefer Beacon since async is rarely reliable during beforeunload
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
	giselleClient,
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

	// biome-ignore lint/correctness/useExhaustiveDependencies(pathname): comment on below
	// biome-ignore lint/correctness/useExhaustiveDependencies(persistence.flush): comment on below
	useEffect(() => {
		// Use cleanup to flush just before pathname changes
		return () => {
			// Note: cleanup doesn't run on initial mount, so we use ref to check
			// This also runs when Provider unmounts
			void persistence.flush("routeChange");
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]); // Previous effect cleanup runs every time pathname changes

	useEffect(() => {
		pathnameRef.current = pathname;
	}, [pathname]);

	// --- beforeunload flush / confirm ---
	useEffect(() => {
		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			if (!persistence.isDirty()) return;

			// 1. Always attempt best-effort save
			persistence.flushBestEffort("beforeUnload");

			// 2. User confirmation (browser-dependent)
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
			<GiselleClientProvider value={giselleClient}>
				{children}
			</GiselleClientProvider>
		</AppDesignerStoreContext.Provider>
	);
}
export function useAppDesignerStoreApi() {
	const store = useContext(AppDesignerStoreContext);
	if (!store) throw new Error("Missing AppDesignerProvider in the tree");
	return store;
}
