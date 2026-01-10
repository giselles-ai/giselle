"use client";

import { createContext, createElement, useContext } from "react";
import type { GiselleClient } from "./giselle-client";

const GiselleClientContext = createContext<GiselleClient | null>(null);

export function GiselleClientProvider({
	children,
	value,
}: React.PropsWithChildren<{ value: GiselleClient }>) {
	// Avoid JSX in a .ts module.
	return createElement(GiselleClientContext.Provider, { value }, children);
}

/**
 * Returns the injected `GiselleClient`.
 * No fallback: callers must be wrapped by `GiselleClientProvider`.
 */
export function useGiselle(): GiselleClient {
	const client = useContext(GiselleClientContext);
	if (!client) {
		throw new Error("Missing GiselleClientProvider in the tree");
	}
	return client;
}
