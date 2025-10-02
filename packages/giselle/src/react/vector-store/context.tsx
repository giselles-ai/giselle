import { createContext, type PropsWithChildren, useContext } from "react";

export interface VectorStoreContextValue {
	githubRepositoryIndexes?: {
		id: string;
		name: string;
		owner: string;
		repo: string;
		contentTypes: {
			contentType: "blob" | "pull_request";
			embeddingProfileIds: number[];
		}[];
	}[];
	documentStores?: {
		id: string;
		name: string;
		embeddingProfileIds: number[];
		sources: Array<{
			id: string;
			fileName: string;
			ingestStatus: "idle" | "running" | "completed" | "failed";
			ingestErrorCode: string | null;
		}>;
	}[];
	documentSettingPath?: string;
	githubSettingPath?: string;
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
