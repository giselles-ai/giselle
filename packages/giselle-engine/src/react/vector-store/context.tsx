import { createContext, type PropsWithChildren, useContext } from "react";
import type { GitHubVectorStoreInfo } from "../../core/vector-store";

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
	return vectorStore;
};
