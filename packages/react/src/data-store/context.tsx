"use client";

import { createContext, useContext } from "react";

export interface DataStoreItem {
	id: string;
	name: string;
}

export interface DataStoreContextValue {
	dataStores: DataStoreItem[];
	settingPath?: string;
}

export const DataStoreContext = createContext<
	DataStoreContextValue | undefined
>(undefined);

export function useDataStore(): DataStoreContextValue | undefined {
	return useContext(DataStoreContext);
}
