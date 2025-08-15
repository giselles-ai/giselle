import { createContext, type PropsWithChildren, useContext } from "react";

export interface VectorStoreContextValue {
	githubRepositoryIndexes?: {
		id: string;
		name: string;
		owner: string;
		repo: string;
		availableContentTypes: ("blob" | "pull_request")[];
		embeddingProfileIds?: number[];
	}[];
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
