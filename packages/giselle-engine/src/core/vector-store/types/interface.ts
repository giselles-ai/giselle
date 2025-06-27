import type { VectorStoreId, VectorStoreObject } from "./object";

type CreateVectorStore = () => Promise<VectorStoreObject>;
type RetrieveVectorStore = (parameters: {
	vectorStoreId: VectorStoreId;
}) => Promise<VectorStoreObject>;
// type DeleteVectorStore = () => Promise<void>;
// type SearchVectorStore = () => Promise<void>;
// type AddFile = (parameters: {
// 	vectorStoreId: VectorStoreId;
// 	file: File;
// }) => Promise<void>;

export interface VectorStore {
	create: CreateVectorStore;
	// retrieve: RetrieveVectorStore;
	// delete: DeleteVectorStore;
	// search: SearchVectorStore;
	// addFile: AddFile;
}
