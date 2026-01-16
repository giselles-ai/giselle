import { createContext, useContext } from "react";

export interface DataStoreContextValue {
	dataStores?: {
		id: string;
		name: string;
	}[];
	settingPath?: string;
	isLoading?: boolean;
}

export const DataStoreContext = createContext<
	Partial<DataStoreContextValue> | undefined
>(undefined);

export interface DataStoreProviderProps {
	value?: Partial<DataStoreContextValue>;
}

export const useDataStore = () => {
	const dataStore = useContext(DataStoreContext);
	return dataStore;
};
