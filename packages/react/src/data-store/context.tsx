"use client";

import type { DataStoreId } from "@giselles-ai/protocol";
import { createContext, useContext } from "react";

export interface DataStoreItem {
	id: DataStoreId;
	name: string;
}

export interface DataStoreContextValue {
	dataStores: DataStoreItem[];
	settingPath: string;
}

export const DataStoreContext = createContext<
	DataStoreContextValue | undefined
>(undefined);

export function useDataStore(): DataStoreContextValue {
	const context = useContext(DataStoreContext);
	if (context === undefined) {
		throw new Error("useDataStore must be used within a DataStoreProvider");
	}
	return context;
}
