"use client";

import type { GiselleClient } from "@giselles-ai/react";
import { createContext, useContext } from "react";

const GiselleClientContext = createContext<GiselleClient | null>(null);

export function GiselleClientProvider({
	children,
	value,
}: React.PropsWithChildren<{ value: GiselleClient }>) {
	return (
		<GiselleClientContext.Provider value={value}>
			{children}
		</GiselleClientContext.Provider>
	);
}

/**
 * Returns the Giselle API client injected at the app-designer root.
 *
 * Note: this intentionally uses the same name as `@giselles-ai/react`'s hook,
 * but is scoped to `app-designer/store`.
 */
export function useGiselle(): GiselleClient {
	const client = useContext(GiselleClientContext);
	if (!client) {
		throw new Error("Missing GiselleClientProvider in the tree");
	}
	return client;
}
