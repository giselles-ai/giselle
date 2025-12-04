import { createContext, useContext } from "react";

export interface VectorStoreContextValue {
	githubRepositoryIndexes?: {
		id: string;
		name: string;
		owner: string;
		repo: string;
		isOfficial: boolean;
		contentTypes: {
			contentType: "blob" | "pull_request" | "issue";
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
		isOfficial: boolean;
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
export const useVectorStore = () => {
	const vectorStore = useContext(VectorStoreContext);
	return vectorStore;
};
