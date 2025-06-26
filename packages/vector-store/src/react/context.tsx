import { type PropsWithChildren, createContext, useContext } from "react";
import type { GitHubVectorStoreInfo } from "../types";

export interface VectorStoreContextValue {
	github: GitHubVectorStoreInfo[];
	settingPath: string;
}

export const VectorStoreContext = createContext<
	Partial<VectorStoreContextValue> | undefined
>(undefined);

export interface VectorStoreProviderProps {
	value?: Partial<VectorStoreContextValue>;
}
export function VectorStoreProvider({
	children,
	...props
}: PropsWithChildren<VectorStoreProviderProps>) {
	return (
		<VectorStoreContext.Provider value={props.value}>
			{children}
		</VectorStoreContext.Provider>
	);
}

export const useVectorStore = () => {
	const vectorStore = useContext(VectorStoreContext);
	if (!vectorStore) {
		throw new Error(
			"useVectorStore must be used within an VectorStoreProvider",
		);
	}
	return vectorStore;
};
